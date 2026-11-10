import type { MediaItem } from "@/components/site/media-asset";
import type { Surface } from "@/components/site/section";
import { SAMPLE_CATALOGUES } from "./catalogue-content";
import { CATALOGUES, type NavIcon } from "./navigation";
import { stock } from "./stock-media";

/**
 * Catalogue data for the public pages. Today it comes from the sample
 * content; once the Catalogue tables are pushed and the admin can manage
 * them, only this file changes (the shapes match the Prisma models).
 */

export type CatalogueItemData = {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  /** Price per unit in naira. */
  price: number;
  moq: number;
  unit: string;
  tags: string[];
  featured: boolean;
  /** Original order, used for "Featured" sorting. */
  position: number;
  media: MediaItem[];
};

export type CatalogueData = {
  slug: string;
  title: string;
  description: string;
  surface: Surface;
  icon: NavIcon;
  image: string;
  href: string;
  categories: string[];
  items: CatalogueItemData[];
};

function toSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

function buildCatalogues(): CatalogueData[] {
  return CATALOGUES.map((c) => {
    const sample = SAMPLE_CATALOGUES.find((s) => s.slug === c.slug);
    const items: CatalogueItemData[] = (sample?.items ?? []).map(
      (it, index) => {
        const slug = toSlug(it.title);
        return {
          id: `${c.slug}-${slug}`,
          slug,
          title: it.title,
          category: it.category,
          description: it.description,
          price: it.price,
          moq: it.moq,
          unit: it.unit,
          tags: it.tags ?? [],
          featured: Boolean(it.featured),
          position: index,
          media: it.media.map((m) =>
            m.startsWith("/videos/")
              ? { kind: "video" as const, src: m, alt: it.title }
              : { kind: "image" as const, src: stock(m, 1200), alt: it.title },
          ),
        };
      },
    );
    // Categories in menu order, plus any extra ones the items use.
    const categories = [
      ...c.categories.filter((cat) => items.some((it) => it.category === cat)),
      ...Array.from(new Set(items.map((it) => it.category))).filter(
        (cat) => !c.categories.includes(cat),
      ),
    ];
    return {
      slug: c.slug,
      title: c.title,
      description: c.description,
      surface: c.surface,
      icon: c.icon,
      image: c.image,
      href: c.href,
      categories,
      items,
    };
  });
}

const CATALOGUE_DATA = buildCatalogues();

export function getCatalogues(): CatalogueData[] {
  return CATALOGUE_DATA;
}

export function getCatalogue(slug: string): CatalogueData | undefined {
  return CATALOGUE_DATA.find((c) => c.slug === slug);
}

export function getCatalogueItem(
  catalogueSlug: string,
  itemSlug: string,
): { catalogue: CatalogueData; item: CatalogueItemData } | undefined {
  const catalogue = getCatalogue(catalogueSlug);
  const item = catalogue?.items.find((i) => i.slug === itemSlug);
  return catalogue && item ? { catalogue, item } : undefined;
}

export function lowestPrice(catalogue: CatalogueData): number | null {
  return catalogue.items.length
    ? Math.min(...catalogue.items.map((i) => i.price))
    : null;
}
