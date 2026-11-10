import "server-only";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import type { MediaItem } from "@/components/site/media-asset";
import { HERO_USE_SAMPLE_PROJECTS, HOME_SAMPLE_PROJECTS } from "./home-content";
import { getBrandLogos, type BrandLogo } from "./brands-data";
import { toMediaItem } from "./media";
import { stock } from "./stock-media";

export type Pillar = "DESIGN" | "BUILD" | "PRINT";

export const PILLAR_LABEL: Record<Pillar, string> = {
  DESIGN: "Design",
  BUILD: "Build",
  PRINT: "Print",
};

/** One piece of work. Compatible with the hero's project gallery. */
export type WorkProject = {
  id: string;
  slug: string;
  title: string;
  category: string;
  pillar: Pillar;
  featured: boolean;
  tags: string[];
  description: string;
  websiteUrl: string | null;
  /** First item is the cover. */
  media: MediaItem[];
};

/** Product and client logos (see brands-data.ts). */
export type WorkBrand = BrandLogo;

/** Stable URL slug (the shared slugify adds a random suffix, so not used here). */
function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((t): t is string => typeof t === "string")
      : [];
  } catch {
    return [];
  }
}

function sampleWorks(): WorkProject[] {
  return HOME_SAMPLE_PROJECTS.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    category: p.category,
    pillar: p.pillar,
    featured: Boolean(p.featured),
    tags: p.tags,
    description: p.description,
    websiteUrl: null,
    media: p.images.map((id) => ({
      kind: "image" as const,
      src: stock(id, 1400),
      alt: p.title,
    })),
  }));
}

async function portfolioWorks(): Promise<WorkProject[]> {
  const rows = await prisma.portfolioItem.findMany({
    where: { isVisible: true },
    orderBy: [
      { isFeatured: "desc" },
      { position: "asc" },
      { updatedAt: "desc" },
    ],
    select: {
      id: true,
      slug: true,
      title: true,
      clientName: true,
      description: true,
      tags: true,
      serviceType: true,
      isFeatured: true,
      websiteUrl: true,
      mediaType: true,
      mediaPublicId: true,
      thumbnailPublicId: true,
      coverAsset: { select: { publicId: true } },
      assets: {
        orderBy: { position: "asc" },
        select: { publicId: true, mediaType: true, thumbnailPublicId: true },
      },
    },
  });

  return rows.map((row) => {
    const title = row.clientName || row.title;
    const assets = row.assets.length
      ? row.assets
      : [
          {
            publicId: row.mediaPublicId,
            mediaType: row.mediaType,
            thumbnailPublicId: row.thumbnailPublicId,
          },
        ];
    // Cover first, then the rest in their saved order.
    const coverId = row.coverAsset?.publicId;
    const ordered = coverId
      ? [
          ...assets.filter((a) => a.publicId === coverId),
          ...assets.filter((a) => a.publicId !== coverId),
        ]
      : assets;

    return {
      id: row.id,
      slug: row.slug || `${toSlug(title)}-${row.id.slice(0, 6)}`,
      title,
      category: PILLAR_LABEL[row.serviceType],
      pillar: row.serviceType,
      featured: row.isFeatured,
      tags: parseTags(row.tags),
      description: row.description ?? "",
      websiteUrl: row.websiteUrl ?? null,
      media: ordered.map((a) =>
        toMediaItem(a.publicId, a.mediaType, title, {
          width: 1400,
          posterId: a.thumbnailPublicId,
        }),
      ),
    };
  });
}

async function loadWorks(): Promise<WorkProject[]> {
  if (HERO_USE_SAMPLE_PROJECTS) return sampleWorks();
  return portfolioWorks().catch(() => []);
}

// Cached until the admin saves (the portfolio and brand actions already call
// updateTag with these tags), so there is no time-based re-reading.
const loadWorksCached = unstable_cache(loadWorks, ["works-v1"], {
  revalidate: false,
  tags: ["portfolio-content"],
});
const dev = process.env.NODE_ENV === "development";

export function getWorks(): Promise<WorkProject[]> {
  return dev ? loadWorks() : loadWorksCached();
}

export function getBrands(): Promise<WorkBrand[]> {
  return getBrandLogos();
}

export async function getWork(slug: string): Promise<WorkProject | undefined> {
  return (await getWorks()).find((w) => w.slug === slug);
}
