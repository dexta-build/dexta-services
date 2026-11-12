import "server-only";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import type { MediaItem } from "@/components/site/media-asset";
import { HOME_SAMPLE_PROJECTS } from "./home-content";
import { loadPage } from "@/lib/content/store";
import { WORKS_PAGE } from "@/lib/content/pages/main";
import { getServiceCatalog, projectCategory } from "@/lib/services/catalog";
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
  /** Occasion or sector, e.g. "Wedding" (empty when none). */
  occasion: string;
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

const SAMPLE_OCCASIONS: Record<string, string> = {
  Wedding: "Wedding",
  Events: "Events",
  Birthdays: "Birthday",
  Education: "Education",
  Corporate: "Corporate",
};

function sampleWorks(): WorkProject[] {
  return HOME_SAMPLE_PROJECTS.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    category: p.category,
    pillar: p.pillar,
    occasion: SAMPLE_OCCASIONS[p.category.split("·")[0].trim()] ?? "",
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

const PROJECT_SELECT = {
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
    orderBy: { position: "asc" as const },
    select: { publicId: true, mediaType: true, thumbnailPublicId: true },
  },
};

async function portfolioRows() {
  const where = { isVisible: true };
  const orderBy = [
    { isFeatured: "desc" as const },
    { position: "asc" as const },
    { updatedAt: "desc" as const },
  ];
  try {
    return await prisma.portfolioItem.findMany({
      where,
      orderBy,
      select: { ...PROJECT_SELECT, service: true, occasion: true },
    });
  } catch {
    // service/occasion columns not pushed yet.
    const rows = await prisma.portfolioItem.findMany({
      where,
      orderBy,
      select: PROJECT_SELECT,
    });
    return rows.map((r) => ({
      ...r,
      service: null as string | null,
      occasion: null as string | null,
    }));
  }
}

async function portfolioWorks(): Promise<WorkProject[]> {
  const [rows, catalog] = await Promise.all([
    portfolioRows(),
    getServiceCatalog(),
  ]);

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
      category: projectCategory(
        {
          group: row.serviceType,
          service: row.service,
          occasion: row.occasion,
        },
        catalog,
      ),
      pillar: row.serviceType,
      occasion: row.occasion ?? "",
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

type Source = "samples" | "projects";

async function loadWorks(source: Source): Promise<WorkProject[]> {
  if (source === "samples") return sampleWorks();
  return portfolioWorks().catch(() => []);
}

const dev = process.env.NODE_ENV === "development";

/**
 * The projects visitors see: the sample projects or the real ones, as set
 * in the Works page editor (Projects gallery → Show). Cached until a
 * project is saved (tag "portfolio-content").
 */
export async function getWorks(): Promise<WorkProject[]> {
  const { data } = await loadPage(WORKS_PAGE);
  const source: Source =
    data.projects.source === "projects" ? "projects" : "samples";
  if (dev) return loadWorks(source);
  return unstable_cache(() => loadWorks(source), ["works-v2", source], {
    revalidate: false,
    tags: ["portfolio-content", "services-catalog"],
  })();
}

export function getBrands(): Promise<WorkBrand[]> {
  return getBrandLogos();
}

export async function getWork(slug: string): Promise<WorkProject | undefined> {
  return (await getWorks()).find((w) => w.slug === slug);
}
