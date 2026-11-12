import "server-only";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { SERVICE_GROUPS } from "@/lib/site/navigation";
import {
  PILLARS,
  SERVICES,
  type Offering,
  type PillarKey,
  type ServicePage,
} from "@/lib/site/services-content";
import { STOCK } from "@/lib/site/stock-media";

/**
 * The service groups and services: from the ServicePillar/Service tables
 * once they've been filled (the Services screen does that on first open),
 * otherwise from the built-in content, so the site always has services.
 */

export const SERVICES_TAG = "services-catalog";

export type CatalogService = {
  id: string | null;
  slug: string;
  title: string;
  shortName: string;
  description: string;
  icon: string;
  cardImage: string;
  externalHref: string | null;
  isVisible: boolean;
};

export type CatalogPillar = {
  id: string | null;
  key: PillarKey;
  title: string;
  pillClass: string | null;
  isVisible: boolean;
  services: CatalogService[];
};

export const PILLAR_KEYS: PillarKey[] = ["design", "build", "print"];

const plain = (s: string) => s.replace(/\*/g, "");

/** Where a service's page (or outside link) is. */
export function serviceHref(
  pillar: string,
  s: Pick<CatalogService, "slug" | "externalHref">,
) {
  return s.externalHref || `/services/${pillar}/${s.slug}`;
}

type MenuGroup = {
  key?: string;
  title: string;
  pillClass?: string;
  items: { title: string; description: string; href: string; icon: string }[];
};

/** The services as they are built into the code (and the old menu). */
export function builtInCatalog(
  groups: MenuGroup[] = SERVICE_GROUPS,
): CatalogPillar[] {
  return PILLAR_KEYS.map((key) => {
    const group = groups.find((g) => g.key === key);
    return {
      id: null,
      key,
      title: group?.title ?? key.charAt(0).toUpperCase() + key.slice(1),
      pillClass: group?.pillClass ?? null,
      isVisible: true,
      services: (group?.items ?? []).map((item) => {
        const slug = item.href.split("/").pop() ?? "";
        const page = SERVICES.find((s) => s.pillar === key && s.slug === slug);
        const external = !item.href.startsWith(`/services/${key}/`);
        return {
          id: null,
          slug: external ? slug.replace(/[^a-z0-9-]/g, "") || "link" : slug,
          title: item.title,
          shortName: page?.shortName ?? item.title.toLowerCase(),
          description: item.description,
          icon: item.icon,
          cardImage: page?.hero.image ?? (external ? STOCK.teamLibrary : ""),
          externalHref: external ? item.href : null,
          isVisible: true,
        };
      }),
    };
  });
}

/** Straight from the database, uncached (for the admin). */
export async function readCatalog(): Promise<CatalogPillar[]> {
  try {
    const pillars = await prisma.servicePillar.findMany({
      orderBy: { position: "asc" },
      include: { services: { orderBy: { position: "asc" } } },
    });
    if (pillars.length === 0) return builtInCatalog();
    return pillars
      .filter((p): p is typeof p & { key: PillarKey } =>
        PILLAR_KEYS.includes(p.key as PillarKey),
      )
      .map((p) => ({
        id: p.id,
        key: p.key,
        title: p.title,
        pillClass: p.pillClass,
        isVisible: p.isVisible,
        services: p.services.map((s) => ({
          id: s.id,
          slug: s.slug,
          title: s.title,
          shortName: s.shortName,
          description: s.description,
          icon: s.icon,
          cardImage: s.cardImage,
          externalHref: s.externalHref,
          isVisible: s.isVisible,
        })),
      }));
  } catch {
    // Tables not created yet (or database unreachable).
    return builtInCatalog();
  }
}

/** Every group and service, including hidden ones (for the admin). */
export async function getFullCatalog(): Promise<CatalogPillar[]> {
  if (process.env.NODE_ENV === "development") return readCatalog();
  try {
    return await unstable_cache(readCatalog, ["services-catalog-v1"], {
      revalidate: false,
      tags: [SERVICES_TAG],
    })();
  } catch {
    return readCatalog();
  }
}

/** Only what visitors see: visible groups and their visible services. */
export async function getServiceCatalog(): Promise<CatalogPillar[]> {
  const all = await getFullCatalog();
  return all
    .filter((p) => p.isVisible)
    .map((p) => ({ ...p, services: p.services.filter((s) => s.isVisible) }));
}

/** The header/footer Services menu, built from the visible services. */
export async function getServiceMenu() {
  const catalog = await getServiceCatalog();
  return catalog.map((p) => ({
    key: p.key,
    title: p.title,
    href: `/services/${p.key}`,
    pillClass: p.pillClass ?? undefined,
    items: p.services.map((s) => ({
      title: s.title,
      description: s.description,
      href: serviceHref(p.key, s),
      icon: s.icon,
    })),
  }));
}

/** A visible service with its own page, or undefined. */
export async function findService(pillar: string, slug: string) {
  const catalog = await getServiceCatalog();
  const p = catalog.find((x) => x.key === pillar);
  const s = p?.services.find((x) => x.slug === slug && !x.externalHref);
  return p && s ? { pillar: p, service: s } : undefined;
}

/** Cards for a group's services (pillar page, Services page, related). */
export function serviceCards(p: CatalogPillar, exclude?: string): Offering[] {
  return p.services
    .filter((s) => s.slug !== exclude || s.externalHref)
    .map((s) => ({
      title: s.title,
      description: s.description,
      image: (s.cardImage || STOCK.teamWhiteboard) as Offering["image"],
      href: serviceHref(p.key, s),
    }));
}

/**
 * The starting content of a service page: the built-in page for the 17
 * original services, or a page based on its group for new ones.
 */
export function baseServicePage(
  pillar: PillarKey,
  s: Pick<
    CatalogService,
    "slug" | "title" | "shortName" | "cardImage" | "description"
  >,
): ServicePage {
  const builtIn = SERVICES.find(
    (x) => x.pillar === pillar && x.slug === s.slug,
  );
  if (builtIn) return builtIn;
  const group = PILLARS[pillar];
  const image = (s.cardImage ||
    group.hero.image) as ServicePage["hero"]["image"];
  return {
    ...group,
    slug: s.slug,
    shortName: s.shortName,
    hero: {
      eyebrow: s.title,
      title: `${s.title}, *done properly*`,
      body: s.description || plain(group.hero.body),
      image,
      chips: [],
    },
    problem: { ...group.problem, eyebrow: `${s.title} made easy` },
    offerings: {
      ...group.offerings,
      eyebrow: "What we offer",
      title: `What's included in *${s.shortName}*`,
      items: [],
    },
    faqs: group.faqs,
  };
}

/** The base page for a group's overview (Design, Build, Print). */
export function basePillarPage(pillar: PillarKey): ServicePage {
  return PILLARS[pillar];
}

const GROUP_LABELS: Record<string, string> = {
  DESIGN: "Design",
  BUILD: "Build",
  PRINT: "Print",
};

/**
 * A project's label: "Wedding · Invitation cards", or the group name when
 * there's no service ("Wedding · Print"). `service` is "pillar/slug".
 */
export function projectCategory(
  p: { group: string; service?: string | null; occasion?: string | null },
  catalog: CatalogPillar[],
) {
  const [pillar, slug] = (p.service ?? "").split("/");
  const svc = slug
    ? catalog
        .find((g) => g.key === pillar)
        ?.services.find((s) => s.slug === slug)
    : undefined;
  const what = svc?.title ?? GROUP_LABELS[p.group] ?? "";
  return [p.occasion, what].filter(Boolean).join(" · ");
}
