import type { CatalogueMenuItem } from "@/lib/site/catalogue-data";
import {
  CATALOGUES,
  MAIN_LINKS,
  PRIMARY_CTA,
  RESOURCES,
  RESOURCES_AFTER,
  SERVICE_GROUPS,
  type NavIcon,
  type NavLink,
} from "@/lib/site/navigation";

/** Header menus as edited in Site settings → Header menus. */
export type SiteNav = {
  labels: {
    services: string;
    catalogues: string;
    resources: string;
    /** Catalogues menu: list heading, cards heading, "browse all" link. */
    cataloguesList?: string;
    cataloguesFeatured?: string;
    cataloguesAll?: string;
  };
  /** From the Catalogues screen, in menu order. */
  catalogues: CatalogueMenuItem[];
  serviceGroups: {
    key?: string;
    title: string;
    href: string;
    pillClass?: string;
    items: { title: string; description: string; href: string; icon: string }[];
  }[];
  mainLinks: NavLink[];
  resourcesAfter: string;
  resources: {
    title: string;
    description: string;
    href: string;
    icon: string;
  }[];
  cta: NavLink;
};

export const DEFAULT_NAV: SiteNav = {
  labels: {
    services: "Services",
    catalogues: "Catalogues",
    resources: "Resources",
    cataloguesList: "Our catalogues",
    cataloguesFeatured: "Featured",
    cataloguesAll: "Browse all catalogues",
  },
  catalogues: CATALOGUES.map((c) => ({
    slug: c.slug,
    title: c.title,
    description: c.description,
    href: c.href,
    icon: c.icon,
    surface: c.surface,
    image: c.image,
    featured: Boolean(c.featured),
  })),
  serviceGroups: SERVICE_GROUPS,
  mainLinks: MAIN_LINKS,
  resourcesAfter: RESOURCES_AFTER,
  resources: RESOURCES,
  cta: PRIMARY_CTA,
};

/** Pill colours for service groups added in the admin (by position). */
const PILLS = [
  "bg-brand-cyan text-royal",
  "bg-royal text-ice",
  "bg-ocean text-white",
  "bg-gold text-royal",
];
export const pillFor = (g: SiteNav["serviceGroups"][number], i: number) =>
  g.pillClass || PILLS[i % PILLS.length];

export const asIcon = (name: string) => name as NavIcon;
