"use server";

import { updateTag } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  portfolioItemSchema,
  type PortfolioAssetInput,
  type PortfolioItemInput,
} from "@/lib/validators";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionResult = { success: boolean; message: string };

export type ServiceType = "DESIGN" | "BUILD" | "PRINT";

export type PortfolioItemRow = {
  id: string;
  serviceType: ServiceType;
  title: string;
  description: string | null;
  tags: string;
  websiteUrl: string | null;
  mediaPublicId: string;
  mediaType: "IMAGE" | "VIDEO";
  thumbnailPublicId: string | null;
  coverAssetId: string | null;
  assets: PortfolioAssetRow[];
  isFeatured: boolean;
  isVisible: boolean;
  position: number;
};

export type PortfolioAssetRow = {
  id: string;
  publicId: string;
  mediaType: "IMAGE" | "VIDEO";
  thumbnailPublicId: string | null;
  caption: string | null;
  position: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

function revalidate() {
  updateTag("portfolio-content");
  updateTag("services-content");
}

function toLegacyPortfolioMutation(data: PortfolioItemInput) {
  const {
    assets: _assets,
    coverAssetId: _coverAssetId,
    objectPosition,
    ...legacyCompatibleData
  } = data;

  return {
    ...legacyCompatibleData,
    ...(objectPosition?.trim()
      ? { objectPosition: objectPosition.trim() }
      : {}),
  };
}

async function deleteCloudinaryAsset(
  publicId: string,
  resourceType: "image" | "video",
) {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch {
    // Best-effort cleanup — do not block the DB delete
  }
}

const PRIMARY_COVER_SELECTION = "__PRIMARY__";

function buildPortfolioAssets(data: PortfolioItemInput): PortfolioAssetInput[] {
  const coverAsset: PortfolioAssetInput = {
    publicId: data.mediaPublicId,
    mediaType: data.mediaType,
    thumbnailPublicId: data.thumbnailPublicId ?? null,
    caption: null,
    position: 0,
  };

  const galleryAssets = (data.assets ?? [])
    .filter((asset) => asset.publicId.trim().length > 0)
    .map((asset, index) => ({
      publicId: asset.publicId,
      mediaType: asset.mediaType,
      thumbnailPublicId: asset.thumbnailPublicId ?? null,
      caption: asset.caption ?? null,
      position: index + 1,
    }));

  return [coverAsset, ...galleryAssets];
}

function resolveCoverAssetPosition(
  coverSelection: string | null | undefined,
  assets: PortfolioAssetInput[],
) {
  if (assets.length <= 1) {
    return 0;
  }

  if (!coverSelection || coverSelection === PRIMARY_COVER_SELECTION) {
    return 0;
  }

  const galleryMatch = /^gallery:(\d+)$/.exec(coverSelection);
  if (!galleryMatch) {
    return 0;
  }

  const galleryIndex = Number.parseInt(galleryMatch[1] ?? "", 10);
  if (Number.isNaN(galleryIndex)) {
    return 0;
  }

  const assetPosition = galleryIndex + 1;
  return assetPosition >= 0 && assetPosition < assets.length
    ? assetPosition
    : 0;
}

async function syncPortfolioAssets(
  portfolioItemId: string,
  assets: PortfolioAssetInput[],
  coverSelection?: string | null,
) {
  await prisma.portfolioAsset.deleteMany({
    where: { portfolioItemId },
  });

  if (assets.length > 0) {
    await prisma.portfolioAsset.createMany({
      data: assets.map((asset) => ({
        portfolioItemId,
        publicId: asset.publicId,
        mediaType: asset.mediaType,
        thumbnailPublicId: asset.thumbnailPublicId ?? null,
        caption: asset.caption ?? null,
        position: asset.position,
      })),
    });
  }

  const orderedAssets = await prisma.portfolioAsset.findMany({
    where: { portfolioItemId },
    orderBy: { position: "asc" },
    select: { id: true },
  });

  const coverAsset =
    orderedAssets[resolveCoverAssetPosition(coverSelection, assets)] ??
    orderedAssets[0] ??
    null;

  await prisma.portfolioItem.update({
    where: { id: portfolioItemId },
    data: { coverAssetId: coverAsset?.id ?? null },
  });
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getPortfolioItems(
  serviceType?: ServiceType,
): Promise<PortfolioItemRow[]> {
  try {
    return (await prisma.portfolioItem.findMany({
      where: serviceType ? { serviceType } : undefined,
      orderBy: { position: "asc" },
      select: {
        id: true,
        serviceType: true,
        title: true,
        description: true,
        tags: true,
        websiteUrl: true,
        mediaPublicId: true,
        mediaType: true,
        thumbnailPublicId: true,
        coverAssetId: true,
        assets: {
          orderBy: { position: "asc" },
          select: {
            id: true,
            publicId: true,
            mediaType: true,
            thumbnailPublicId: true,
            caption: true,
            position: true,
          },
        },
        isFeatured: true,
        isVisible: true,
        position: true,
      },
    })) as PortfolioItemRow[];
  } catch (error) {
    console.warn("[Get Portfolio Items] Failed:", error);
    return [];
  }
}

export async function getPortfolioFeaturedCounts(): Promise<
  Record<ServiceType, number>
> {
  try {
    const counts = await prisma.portfolioItem.groupBy({
      by: ["serviceType"],
      where: { isFeatured: true },
      _count: true,
    });
    const result: Record<ServiceType, number> = {
      DESIGN: 0,
      BUILD: 0,
      PRINT: 0,
    };
    for (const row of counts) {
      result[row.serviceType as ServiceType] = row._count;
    }
    return result;
  } catch {
    return { DESIGN: 0, BUILD: 0, PRINT: 0 };
  }
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createPortfolioItem(
  data: PortfolioItemInput,
): Promise<ActionResult> {
  try {
    await requireAuth();

    const parsed = portfolioItemSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Validation failed",
      };
    }

    const last = await prisma.portfolioItem.findFirst({
      where: { serviceType: parsed.data.serviceType },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    const position = last ? last.position + 1 : 0;
    const assets = buildPortfolioAssets(parsed.data);

    const created = await prisma.portfolioItem.create({
      data: { ...toLegacyPortfolioMutation(parsed.data), position },
      select: { id: true },
    });

    await syncPortfolioAssets(created.id, assets, parsed.data.coverAssetId);

    revalidate();
    return { success: true, message: "Portfolio item created successfully" };
  } catch (error) {
    console.error("[Create Portfolio Item]", error);
    return { success: false, message: "Failed to create portfolio item" };
  }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updatePortfolioItem(
  id: string,
  data: PortfolioItemInput,
): Promise<ActionResult> {
  try {
    await requireAuth();

    const parsed = portfolioItemSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Validation failed",
      };
    }

    const assets = buildPortfolioAssets(parsed.data);

    await prisma.portfolioItem.update({
      where: { id },
      data: toLegacyPortfolioMutation(parsed.data),
    });

    await syncPortfolioAssets(id, assets, parsed.data.coverAssetId);

    revalidate();
    return { success: true, message: "Portfolio item updated successfully" };
  } catch (error) {
    console.error("[Update Portfolio Item]", error);
    return { success: false, message: "Failed to update portfolio item" };
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deletePortfolioItem(id: string): Promise<ActionResult> {
  try {
    await requireAuth();

    const item = await prisma.portfolioItem.findUnique({
      where: { id },
      select: {
        mediaPublicId: true,
        mediaType: true,
        thumbnailPublicId: true,
        assets: {
          select: {
            publicId: true,
            mediaType: true,
            thumbnailPublicId: true,
          },
        },
      },
    });

    if (!item) return { success: false, message: "Item not found" };

    await prisma.portfolioItem.delete({ where: { id } });

    // Cleanup Cloudinary assets after DB delete succeeds
    const resourceType = item.mediaType === "VIDEO" ? "video" : "image";
    await deleteCloudinaryAsset(item.mediaPublicId, resourceType);
    if (item.thumbnailPublicId) {
      await deleteCloudinaryAsset(item.thumbnailPublicId, "image");
    }
    for (const asset of item.assets) {
      await deleteCloudinaryAsset(
        asset.publicId,
        asset.mediaType === "VIDEO" ? "video" : "image",
      );
      if (asset.thumbnailPublicId) {
        await deleteCloudinaryAsset(asset.thumbnailPublicId, "image");
      }
    }

    revalidate();
    return { success: true, message: "Portfolio item deleted successfully" };
  } catch (error) {
    console.error("[Delete Portfolio Item]", error);
    return { success: false, message: "Failed to delete portfolio item" };
  }
}

export async function deletePortfolioItems(
  ids: string[],
): Promise<ActionResult> {
  try {
    await requireAuth();

    if (!ids.length) {
      return { success: false, message: "No items selected." };
    }

    const items = await prisma.portfolioItem.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        mediaPublicId: true,
        mediaType: true,
        thumbnailPublicId: true,
        assets: {
          select: {
            publicId: true,
            mediaType: true,
            thumbnailPublicId: true,
          },
        },
      },
    });

    await prisma.portfolioItem.deleteMany({
      where: { id: { in: ids } },
    });

    for (const item of items) {
      const resourceType = item.mediaType === "VIDEO" ? "video" : "image";
      void deleteCloudinaryAsset(item.mediaPublicId, resourceType);
      if (item.thumbnailPublicId) {
        void deleteCloudinaryAsset(item.thumbnailPublicId, "image");
      }
      for (const asset of item.assets) {
        void deleteCloudinaryAsset(
          asset.publicId,
          asset.mediaType === "VIDEO" ? "video" : "image",
        );
        if (asset.thumbnailPublicId) {
          void deleteCloudinaryAsset(asset.thumbnailPublicId, "image");
        }
      }
    }

    revalidate();
    return {
      success: true,
      message: `Deleted ${ids.length} portfolio item${ids.length === 1 ? "" : "s"} successfully`,
    };
  } catch (error) {
    console.error("[Delete Portfolio Items]", error);
    return { success: false, message: "Failed to delete portfolio items" };
  }
}

// ─── Toggle Featured ──────────────────────────────────────────────────────────

export async function toggleFeatured(
  id: string,
  current: boolean,
): Promise<ActionResult> {
  try {
    await requireAuth();

    await prisma.portfolioItem.update({
      where: { id },
      data: { isFeatured: !current },
    });

    revalidate();
    return {
      success: true,
      message: !current ? "Marked as featured" : "Removed from featured",
    };
  } catch (error) {
    console.error("[Toggle Featured]", error);
    return { success: false, message: "Failed to update featured status" };
  }
}

// ─── Toggle Visibility ────────────────────────────────────────────────────────

export async function toggleVisibility(
  id: string,
  current: boolean,
): Promise<ActionResult> {
  try {
    await requireAuth();

    await prisma.portfolioItem.update({
      where: { id },
      data: { isVisible: !current },
    });

    revalidate();
    return { success: true, message: "Visibility updated" };
  } catch (error) {
    console.error("[Toggle Visibility]", error);
    return { success: false, message: "Failed to update visibility" };
  }
}

// ─── Reorder ──────────────────────────────────────────────────────────────────

export async function reorderPortfolioItems(
  orderedIds: string[],
): Promise<ActionResult> {
  try {
    await requireAuth();

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.portfolioItem.update({
          where: { id },
          data: { position: index },
        }),
      ),
    );

    revalidate();
    return { success: true, message: "Order saved" };
  } catch (error) {
    console.error("[Reorder Portfolio Items]", error);
    return { success: false, message: "Failed to reorder items" };
  }
}
