import type { MediaItem } from "@/components/site/media-asset";
import type { Surface } from "@/components/site/section";
import { SAMPLE_CATALOGUES } from "./catalogue-content";
import { CATALOGUES, type NavIcon } from "./navigation";
import { stock } from "./stock-media";

/**
 * Catalogue shapes shared by the public pages (server and client) and the
 * built-in sample catalogues. The database reader is catalogue-store.ts.
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
  /** Admin order, used for "Featured" sorting. */
  position: number;
  /** When it was added (ms), used for "Newest" sorting. */
  createdAt: number;
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
  /** Optional hero heading; empty uses the shared pattern. */
  heroTitle: string;
  /** Optional hero text; empty uses the description plus the shared line. */
  heroText: string;
  /** Image card in the Catalogues menu. */
  featured: boolean;
  /** Shown in the homepage showcase. */
  showOnHome: boolean;
  categories: string[];
  items: CatalogueItemData[];
};

/** A catalogue as the header menu, mobile menu and footer need it. */
export type CatalogueMenuItem = Pick<
  CatalogueData,
  "slug" | "title" | "description" | "href" | "icon" | "surface" | "image"
> & { featured: boolean };

/** A catalogue tab in the homepage showcase. */
export type ShowcaseCatalogue = Pick<
  CatalogueData,
  "slug" | "title" | "href" | "icon" | "surface" | "image"
> & { tiles: { name: string; image: string }[] };

export function toSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

/** The built-in catalogues with their sample items (placeholder prices). */
export function sampleCatalogues(): CatalogueData[] {
  const base = Date.UTC(2026, 0, 1);
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
          createdAt: base + index * 60_000,
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
      heroTitle: "",
      heroText: "",
      featured: Boolean(c.featured),
      showOnHome: true,
      categories,
      items,
    };
  });
}

export function menuItemsFor(catalogues: CatalogueData[]): CatalogueMenuItem[] {
  return catalogues.map((c) => ({
    slug: c.slug,
    title: c.title,
    description: c.description,
    href: c.href,
    icon: c.icon,
    surface: c.surface,
    image: c.image,
    featured: c.featured,
  }));
}

/**
 * Homepage showcase tabs: each catalogue's first six categories, each with
 * the first image of a design in it (or another catalogue image).
 */
export function showcaseFor(catalogues: CatalogueData[]): ShowcaseCatalogue[] {
  const pool = catalogues.map((c) => c.image).filter(Boolean);
  return catalogues
    .filter((c) => c.showOnHome)
    .map((c) => {
      const start = Math.max(0, pool.indexOf(c.image));
      const cats = c.categories.length
        ? c.categories
        : Array.from(new Set(c.items.map((i) => i.category)));
      return {
        slug: c.slug,
        title: c.title,
        href: c.href,
        icon: c.icon,
        surface: c.surface,
        image: c.image,
        tiles: cats.slice(0, 6).map((name, i) => ({
          name,
          image:
            c.items.find(
              (it) => it.category === name && it.media[0]?.kind === "image",
            )?.media[0]?.src ??
            pool[(start + i) % Math.max(pool.length, 1)] ??
            c.image,
        })),
      };
    });
}

export function lowestPrice(catalogue: CatalogueData): number | null {
  return catalogue.items.length
    ? Math.min(...catalogue.items.map((i) => i.price))
    : null;
}
