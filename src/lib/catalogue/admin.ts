import "server-only";
import prisma from "@/lib/prisma";
import { SAMPLE_CATALOGUES } from "@/lib/site/catalogue-content";
import { toSlug } from "@/lib/site/catalogue-data";
import { CATALOGUES } from "@/lib/site/navigation";
import { isVideoSource } from "@/lib/site/stock-media";

export type SeedResult = { ready: true } | { ready: false; message: string };

/**
 * The first time the Catalogues screen opens, copy the built-in catalogues,
 * their categories and the sample items (marked as samples, so they can be
 * found and replaced). Does nothing once there is a catalogue.
 */
export async function ensureCataloguesSeeded(): Promise<SeedResult> {
  try {
    if ((await prisma.catalogue.count()) > 0) return { ready: true };
    await prisma.$transaction(
      async (tx) => {
        for (const [ci, c] of CATALOGUES.entries()) {
          const sample = SAMPLE_CATALOGUES.find((s) => s.slug === c.slug);
          const items = sample?.items ?? [];
          const names = [
            ...c.categories,
            ...items
              .map((i) => i.category)
              .filter((n, idx, all) => all.indexOf(n) === idx)
              .filter((n) => !c.categories.includes(n)),
          ];
          const catalogue = await tx.catalogue.create({
            data: {
              slug: c.slug,
              title: c.title,
              description: c.description,
              accent: c.surface,
              icon: c.icon,
              coverPublicId: c.image,
              isFeatured: Boolean(c.featured),
              showOnHome: true,
              position: ci,
              categories: {
                create: names.map((name, position) => ({
                  name,
                  slug: toSlug(name),
                  position,
                })),
              },
            },
            include: { categories: true },
          });
          const byName = new Map(
            catalogue.categories.map((cat) => [cat.name, cat.id]),
          );
          const used = new Set<string>();
          for (const [position, it] of items.entries()) {
            let slug = toSlug(it.title);
            while (used.has(slug)) slug = `${slug}-2`;
            used.add(slug);
            await tx.catalogueItem.create({
              data: {
                catalogueId: catalogue.id,
                categoryId: byName.get(it.category) ?? null,
                slug,
                title: it.title,
                description: it.description,
                price: it.price,
                moq: it.moq,
                unit: it.unit,
                tags: JSON.stringify(it.tags ?? []),
                isFeatured: Boolean(it.featured),
                isSample: true,
                position,
                media: {
                  create: it.media.map((m, i) => ({
                    publicId: m,
                    mediaType: isVideoSource(m) ? "VIDEO" : "IMAGE",
                    position: i,
                  })),
                },
              },
            });
          }
        }
      },
      { timeout: 60_000, maxWait: 15_000 },
    );
    return { ready: true };
  } catch (error) {
    if ((await prisma.catalogue.count().catch(() => 0)) > 0)
      return { ready: true };
    const message = (error as Error).message ?? "";
    console.warn(
      "[catalogues] could not copy the built-in catalogues:",
      message,
    );
    return {
      ready: false,
      message:
        /column|does not exist|Unknown argument|isSample|heroTitle/i.test(
          message,
        )
          ? "Run the database update for this release (prisma db push), restart the site, then refresh."
          : `Something went wrong: ${message}`,
    };
  }
}

export type AdminCatalogueRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  color: string;
  icon: string;
  cover: string;
  heroTitle: string;
  heroText: string;
  isFeatured: boolean;
  showOnHome: boolean;
  isVisible: boolean;
  itemCount: number;
  sampleCount: number;
};

export async function readCataloguesForAdmin(): Promise<AdminCatalogueRow[]> {
  const [rows, samples] = await Promise.all([
    prisma.catalogue.findMany({
      orderBy: { position: "asc" },
      include: { _count: { select: { items: true } } },
    }),
    prisma.catalogueItem.groupBy({
      by: ["catalogueId"],
      where: { isSample: true },
      _count: { _all: true },
    }),
  ]);
  return rows.map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.description,
    color: c.accent,
    icon: c.icon,
    cover: c.coverPublicId ?? "",
    heroTitle: c.heroTitle ?? "",
    heroText: c.heroText ?? "",
    isFeatured: c.isFeatured,
    showOnHome: c.showOnHome,
    isVisible: c.isVisible,
    itemCount: c._count.items,
    sampleCount: samples.find((s) => s.catalogueId === c.id)?._count._all ?? 0,
  }));
}

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  isVisible: boolean;
  itemCount: number;
};

export type AdminItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  categoryId: string;
  price: number;
  moq: number;
  unit: string;
  tags: string[];
  media: string[];
  isFeatured: boolean;
  isVisible: boolean;
  isSample: boolean;
  position: number;
  updatedAt: string;
};

function parseTags(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((t) => typeof t === "string") : [];
  } catch {
    return [];
  }
}

export async function readCatalogueForAdmin(id: string) {
  const c = await prisma.catalogue.findUnique({
    where: { id },
    include: {
      categories: {
        orderBy: { position: "asc" },
        include: { _count: { select: { items: true } } },
      },
      items: {
        orderBy: { position: "asc" },
        include: { media: { orderBy: { position: "asc" } } },
      },
    },
  });
  if (!c) return null;
  const categories: AdminCategory[] = c.categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    isVisible: cat.isVisible,
    itemCount: cat._count.items,
  }));
  const items: AdminItem[] = c.items.map((it) => ({
    id: it.id,
    slug: it.slug,
    title: it.title,
    description: it.description,
    categoryId: it.categoryId ?? "",
    price: it.price,
    moq: it.moq,
    unit: it.unit,
    tags: parseTags(it.tags),
    media: it.media.map((m) => m.publicId),
    isFeatured: it.isFeatured,
    isVisible: it.isVisible,
    isSample: it.isSample,
    position: it.position,
    updatedAt: it.updatedAt.toISOString(),
  }));
  return {
    catalogue: { id: c.id, slug: c.slug, title: c.title, color: c.accent },
    categories,
    items,
  };
}
