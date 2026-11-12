import "server-only";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import type { Surface } from "@/components/site/section";
import {
  menuItemsFor,
  sampleCatalogues,
  showcaseFor,
  type CatalogueData,
  type CatalogueItemData,
} from "./catalogue-data";
import { CATALOGUES, type NavIcon } from "./navigation";
import { mediaItemFor, stock } from "./stock-media";

/**
 * Catalogues for the public site, from the Catalogue tables. Until the
 * admin has filled them (first open of /admin/catalogues), the built-in
 * sample catalogues are shown. Cached on the "catalogues" tag; no polling.
 */

export const CATALOGUES_TAG = "catalogues";

const OTHER = "Other";

function parseTags(raw: string) {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((t) => typeof t === "string") : [];
  } catch {
    return [];
  }
}

async function readCatalogues(): Promise<CatalogueData[]> {
  let rows;
  try {
    if ((await prisma.catalogue.count()) === 0) return sampleCatalogues();
    rows = await prisma.catalogue.findMany({
      where: { isVisible: true },
      orderBy: { position: "asc" },
      include: {
        categories: {
          where: { isVisible: true },
          orderBy: { position: "asc" },
        },
        items: {
          where: { isVisible: true },
          orderBy: { position: "asc" },
          include: {
            category: { select: { name: true, isVisible: true } },
            media: { orderBy: { position: "asc" } },
          },
        },
      },
    });
  } catch (error) {
    console.warn(
      "[catalogues] reading the database failed; showing samples:",
      (error as Error).message,
    );
    return sampleCatalogues();
  }

  return rows.map((c) => {
    const builtIn = CATALOGUES.find((b) => b.slug === c.slug);
    const items: CatalogueItemData[] = c.items
      // Items in a hidden category are hidden with it.
      .filter((it) => !it.category || it.category.isVisible)
      .map((it) => ({
        id: it.id,
        slug: it.slug,
        title: it.title,
        category: it.category?.name ?? OTHER,
        description: it.description,
        price: it.price,
        moq: it.moq,
        unit: it.unit,
        tags: parseTags(it.tags),
        featured: it.isFeatured,
        position: it.position,
        createdAt: it.createdAt.getTime(),
        media: it.media.map((m) => {
          const item = mediaItemFor(m.publicId, m.alt || it.title);
          return m.mediaType === "VIDEO" && item.kind === "image"
            ? { kind: "video" as const, src: m.publicId, alt: item.alt }
            : item;
        }),
      }));
    const used = new Set(items.map((i) => i.category));
    const categories = [
      ...c.categories.map((cat) => cat.name).filter((n) => used.has(n)),
      ...(used.has(OTHER) ? [OTHER] : []),
    ];
    const firstImage = items
      .flatMap((i) => i.media)
      .find((m) => m.kind === "image")?.src;
    return {
      slug: c.slug,
      title: c.title,
      description: c.description,
      surface: c.accent as Surface,
      icon: c.icon as NavIcon,
      image: c.coverPublicId
        ? stock(c.coverPublicId, 1200, 900)
        : (firstImage ?? builtIn?.image ?? ""),
      href: `/catalogue/${c.slug}`,
      heroTitle: c.heroTitle ?? "",
      heroText: c.heroText ?? "",
      featured: c.isFeatured,
      showOnHome: c.showOnHome,
      categories,
      items,
    };
  });
}

const readCataloguesCached = unstable_cache(readCatalogues, ["catalogues-v2"], {
  revalidate: false,
  tags: [CATALOGUES_TAG],
});

export function getCatalogues(): Promise<CatalogueData[]> {
  return process.env.NODE_ENV === "development"
    ? readCatalogues()
    : readCataloguesCached();
}

export async function getCatalogue(slug: string) {
  return (await getCatalogues()).find((c) => c.slug === slug);
}

export async function getCatalogueItem(
  catalogueSlug: string,
  itemSlug: string,
) {
  const catalogue = await getCatalogue(catalogueSlug);
  const item = catalogue?.items.find((i) => i.slug === itemSlug);
  return catalogue && item ? { catalogue, item } : undefined;
}

/** Catalogues for the header menu, mobile menu and footer. */
export async function getCatalogueMenu() {
  return menuItemsFor(await getCatalogues());
}

/** Tabs for the homepage catalogue showcase. */
export async function getCatalogueShowcase() {
  return showcaseFor(await getCatalogues());
}
