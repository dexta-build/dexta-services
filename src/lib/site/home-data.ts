import "server-only";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { fetchSchoolWebsiteTestimonials } from "@/lib/api";
import type { MediaItem } from "@/components/site/media-asset";
import {
  HERO_USE_SAMPLE_PROJECTS,
  HOME_FALLBACK_HERO,
  HOME_SAMPLE_PROJECTS,
} from "./home-content";
import { stock } from "./stock-media";
import { getBrandLogos, type BrandLogo } from "./brands-data";
import { imageUrl, toMediaItem } from "./media";

type ServiceType = "DESIGN" | "BUILD" | "PRINT";

export type HomeHero = {
  /** Headline with *accent* markers. */
  headline: string;
  body: string;
  ctaText: string;
  ctaHref: string;
};

/** A hero tile: one project, with all its media for the project gallery. */
export type HeroProject = {
  id: string;
  title: string;
  category: string;
  tags: string[];
  description: string;
  /** First item is the tile cover. */
  media: MediaItem[];
};

export type HomeService = {
  type: ServiceType;
  description: string;
  media: MediaItem | null;
};

export type HomeWork = {
  /** Link to the project page; defaults to /works. */
  href?: string;
  id: string;
  title: string;
  tags: string[];
  serviceLabel: string;
  media: MediaItem;
};

/** Product and client logos (see brands-data.ts). */
export type HomeBrand = BrandLogo;

export type HomeTestimonial = {
  id: string;
  quote: string;
  author: string;
  role: string;
  company: string;
  logo: string | null;
};

export type HomeData = {
  hero: HomeHero;
  heroProjects: HeroProject[];
  manifesto: string;
  services: HomeService[];
  works: HomeWork[];
  brands: HomeBrand[];
  testimonials: HomeTestimonial[];
};

const SERVICE_LABEL: Record<ServiceType, string> = {
  DESIGN: "Design",
  BUILD: "Build",
  PRINT: "Print",
};

const SERVICE_ORDER: ServiceType[] = ["DESIGN", "BUILD", "PRINT"];

/** "<p>Saturating ... <strong>Imprints</strong></p>" -> "Saturating ... *Imprints*" */
function htmlToAccentText(html: string): string {
  return decodeEntities(
    html
      .replace(/<\s*(strong|b|em)\b[^>]*>/gi, "*")
      .replace(/<\s*\/\s*(strong|b|em)\s*>/gi, "*")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, "")
      .replace(/\*\s*\*/g, "")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function stripHtml(html: string): string {
  return decodeEntities(
    html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–");
}

/** "IF YOU'VE GOT A VISION, WE'VE GOT THE CREATIVE AUDACITY" -> sentence case, last two words accented. */
function manifestoToAccent(text: string): string {
  const lower = text.trim().toLowerCase().replace(/\s+/g, " ");
  if (!lower) return "";
  const sentence = lower.charAt(0).toUpperCase() + lower.slice(1);
  const words = sentence.replace(/[.!]+$/, "").split(" ");
  if (words.length < 4) return `${sentence}`;
  const tail = words.splice(-2).join(" ");
  return `${words.join(" ")} *${tail}.*`;
}

function parseTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((t) => typeof t === "string")
      : [];
  } catch {
    return [];
  }
}

function mapHeroHref(href: string): string {
  // The old site linked to /projects; Works replaces it.
  return href === "/projects" ? "/works" : href || "/works";
}

async function loadHomeData(): Promise<HomeData> {
  const [
    heroRow,
    manifestoRow,
    serviceRows,
    portfolioRows,
    brands,
    testimonialRows,
  ] = await Promise.all([
    prisma.heroContent.findFirst().catch(() => null),
    prisma.manifestoContent.findFirst().catch(() => null),
    prisma.serviceContent.findMany().catch(() => []),
    prisma.portfolioItem
      .findMany({
        where: { isVisible: true },
        orderBy: [
          { isFeatured: "desc" },
          { position: "asc" },
          { updatedAt: "desc" },
        ],
        take: 24,
        select: {
          id: true,
          title: true,
          clientName: true,
          description: true,
          tags: true,
          serviceType: true,
          isFeatured: true,
          mediaType: true,
          mediaPublicId: true,
          thumbnailPublicId: true,
          coverAsset: {
            select: {
              publicId: true,
              mediaType: true,
              thumbnailPublicId: true,
            },
          },
          assets: {
            orderBy: { position: "asc" },
            select: {
              id: true,
              publicId: true,
              mediaType: true,
              thumbnailPublicId: true,
            },
          },
        },
      })
      .catch(() => []),
    getBrandLogos().catch(() => []),
    fetchSchoolWebsiteTestimonials().catch(() => []),
  ]);

  const hero: HomeHero = heroRow
    ? {
        headline:
          htmlToAccentText(heroRow.headline) || HOME_FALLBACK_HERO.headline,
        body: stripHtml(heroRow.body) || HOME_FALLBACK_HERO.body,
        ctaText: heroRow.ctaText || HOME_FALLBACK_HERO.ctaText,
        ctaHref: mapHeroHref(heroRow.ctaHref),
      }
    : HOME_FALLBACK_HERO;

  const portfolio = portfolioRows.map((row) => {
    const cover = row.coverAsset;
    const media = cover
      ? toMediaItem(cover.publicId, cover.mediaType, row.title, {
          width: 720,
          height: 960,
          posterId: cover.thumbnailPublicId,
        })
      : toMediaItem(row.mediaPublicId, row.mediaType, row.title, {
          width: 720,
          height: 960,
          posterId: row.thumbnailPublicId,
        });
    return { row, media };
  });

  // Hero projects: sample projects (stock) until real work is uploaded,
  // otherwise the admin's portfolio with every asset for the gallery.
  const heroProjects: HeroProject[] = HERO_USE_SAMPLE_PROJECTS
    ? HOME_SAMPLE_PROJECTS.map((p) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        tags: p.tags,
        description: p.description,
        media: p.images.map((id) => ({
          kind: "image" as const,
          src: stock(id, 1200),
          alt: p.title,
        })),
      }))
    : portfolio.map(({ row, media }) => ({
        id: row.id,
        title: row.clientName || row.title,
        category: SERVICE_LABEL[row.serviceType],
        tags: parseTags(row.tags),
        description: row.description ?? "",
        media: [
          media,
          ...row.assets
            .filter((a) => a.publicId !== row.coverAsset?.publicId)
            .map((a) =>
              toMediaItem(a.publicId, a.mediaType, row.title, {
                width: 1200,
                posterId: a.thumbnailPublicId,
              }),
            ),
        ],
      }));

  const services: HomeService[] = SERVICE_ORDER.map((type) => {
    const row = serviceRows.find((s) => s.type === type);
    const featured = portfolio.find(
      ({ row: p }) => p.serviceType === type && p.mediaType === "IMAGE",
    );
    return {
      type,
      description: row?.description ?? "",
      media: featured
        ? featured.media
        : row?.backgroundImagePublicId
          ? {
              kind: "image",
              src: imageUrl(row.backgroundImagePublicId, 900, 700),
              alt: "",
            }
          : null,
    };
  });

  const works: HomeWork[] = portfolio
    .filter(({ row }) => row.isFeatured)
    .slice(0, 6)
    .map(({ row, media }) => ({
      id: row.id,
      title: row.clientName || row.title,
      tags: parseTags(row.tags),
      serviceLabel: SERVICE_LABEL[row.serviceType],
      media,
    }));

  return {
    hero,
    heroProjects,
    manifesto: manifestoRow?.text ? manifestoToAccent(manifestoRow.text) : "",
    services,
    works,
    brands,
    testimonials: testimonialRows.map((t) => ({
      id: t.id,
      quote: t.quote,
      author: t.authorName,
      role: t.authorPosition,
      company: t.schoolName,
      logo: t.logoPublicId ? imageUrl(t.logoPublicId, 160) : null,
    })),
  };
}

// Cached until the admin saves: each admin action already calls updateTag()
// with these tags, so the homepage refreshes only when content changes.
const loadHomeDataCached = unstable_cache(loadHomeData, ["home-data-v1"], {
  revalidate: false,
  tags: [
    "hero-content",
    "manifesto-content",
    "services-content",
    "portfolio-content",
    "expressions-content",
    "clients-content",
    "school-website-testimonials",
  ],
});

export function getHomeData(): Promise<HomeData> {
  return process.env.NODE_ENV === "development"
    ? loadHomeData()
    : loadHomeDataCached();
}
