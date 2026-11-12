import "server-only";
import type { PillarKey, ServicePage } from "@/lib/site/services-content";
import {
  baseServicePage,
  basePillarPage,
  getFullCatalog,
  getServiceCatalog,
  serviceCards,
  type CatalogPillar,
} from "@/lib/services/catalog";
import { f } from "../fields";
import { page, section, seoSection } from "../define";
import { faqFields } from "./shared";
import { loadPage } from "../store";

const USE_CASE_ICONS = [
  ["rocket", "Rocket"],
  ["store", "Shop"],
  ["heart", "Heart"],
  ["graduation", "Graduation cap"],
  ["church", "Church"],
  ["building", "Building"],
  ["megaphone", "Megaphone"],
  ["calendar", "Calendar"],
  ["users", "People"],
  ["globe", "Globe"],
].map(([value, label]) => ({ value, label }));

const intro = (o: { lead?: boolean; image?: boolean } = {}) => ({
  eyebrow: f.eyebrow(),
  title: f.heading(),
  ...(o.lead ? { lead: f.textarea("Lead", { max: 400, rows: 3 }) } : {}),
  body: f.textarea("Body", { max: 600, rows: 3 }),
  ...(o.image ? { image: f.image("Image") } : {}),
});

const plain = (s: string) => s.replace(/\*/g, "");

/** One editable page for a pillar (Design/Build/Print) or a single service. */
function servicePageDef(sp: ServicePage, isPillar: boolean, title?: string) {
  const path = isPillar
    ? `/services/${sp.pillar}`
    : `/services/${sp.pillar}/${sp.slug}`;
  const name =
    title ??
    (isPillar
      ? sp.pillar.charAt(0).toUpperCase() + sp.pillar.slice(1)
      : plain(sp.hero.eyebrow));
  return page({
    key: isPillar ? `service.${sp.pillar}` : `service.${sp.pillar}.${sp.slug}`,
    label: isPillar ? `${name} (overview)` : name,
    path,
    area: "services",
    group: "Services",
    sections: [
      section({
        key: "hero",
        label: "Hero",
        canHide: false,
        fields: {
          eyebrow: f.eyebrow(),
          title: f.heading("Headline"),
          body: f.textarea("Intro", { max: 400, rows: 3 }),
          image: f.image("Background image"),
          chips: f.list(
            "Floating chips",
            "Chip",
            { label: f.text("Text", { max: 30 }), image: f.image("Thumbnail") },
            { titleKey: "label", max: 10 },
          ),
        },
        defaults: sp.hero as ServicePage["hero"],
      }),
      section({
        key: "problem",
        label: "The problem",
        fields: intro({ lead: true, image: true }),
        defaults: sp.problem as ServicePage["problem"],
      }),
      section({
        key: "trust",
        label: "Numbers",
        fields: {
          ...intro(),
          stats: f.list(
            "Numbers",
            "Number",
            {
              value: f.number("Number", { min: 0 }),
              suffix: f.text("After the number", { max: 4, optional: true }),
              label: f.text("What it counts", { max: 120 }),
            },
            { titleKey: "label", max: 6 },
          ),
        },
        defaults: sp.trust as ServicePage["trust"],
      }),
      isPillar
        ? section({
            key: "offerings",
            label: "Services in this group",
            description:
              "Heading over the service cards. The cards are this group's services, in the order set on the Services screen.",
            fields: intro(),
            defaults: {
              eyebrow: sp.offerings.eyebrow,
              title: sp.offerings.title,
              body: sp.offerings.body,
            },
          })
        : section({
            key: "offerings",
            label: "What's included",
            fields: {
              ...intro(),
              items: f.list(
                "Offerings",
                "Offering",
                {
                  title: f.text("Title", { max: 80 }),
                  description: f.textarea("Description", { max: 300, rows: 2 }),
                  image: f.image("Image"),
                  href: f.url("Links to", { optional: true }),
                },
                { titleKey: "title", max: 16 },
              ),
            },
            defaults: sp.offerings as ServicePage["offerings"],
          }),
      ...(sp.techStack
        ? [
            section({
              key: "techStack",
              label: "Technologies",
              fields: {
                ...intro(),
                groups: f.list(
                  "Groups",
                  "Group",
                  {
                    label: f.text("Group name", { max: 40 }),
                    items: f.strings("Technologies", { max: 30 }),
                  },
                  { titleKey: "label", max: 8 },
                ),
              },
              defaults: sp.techStack as NonNullable<ServicePage["techStack"]>,
            }),
          ]
        : []),
      section({
        key: "useCases",
        label: "Who it's for",
        fields: {
          ...intro(),
          items: f.list(
            "Use cases",
            "Use case",
            {
              icon: f.select("Icon", USE_CASE_ICONS),
              title: f.text("Title", { max: 80 }),
              description: f.textarea("Description", { max: 300, rows: 2 }),
            },
            { titleKey: "title", max: 12 },
          ),
        },
        defaults: {
          ...sp.useCases,
          items: sp.useCases.items.map((i) => ({
            ...i,
            icon: i.icon as string,
          })),
        },
      }),
      section({
        key: "quality",
        label: "Quality",
        fields: {
          ...intro({ image: true }),
          items: f.list(
            "Points",
            "Point",
            {
              label: f.text("Label", { max: 30 }),
              title: f.text("Title", { max: 120 }),
            },
            { titleKey: "title", max: 8 },
          ),
        },
        defaults: sp.quality as ServicePage["quality"],
      }),
      section({
        key: "process",
        label: "Process",
        fields: {
          ...intro(),
          steps: f.list(
            "Steps",
            "Step",
            {
              title: f.text("Title", { max: 80 }),
              description: f.textarea("Description", { max: 400, rows: 2 }),
            },
            { titleKey: "title", max: 10 },
          ),
        },
        defaults: sp.process as ServicePage["process"],
      }),
      ...(isPillar
        ? []
        : [
            section({
              key: "related",
              label: "Related services",
              description:
                "Cards for the other services in the same group, in their Services-screen order.",
              fields: {
                title: f.heading(),
                count: f.number("How many cards", { min: 1, max: 6 }),
              },
              defaults: {
                title: `Explore more *${sp.pillar}* services`,
                count: 3,
              },
            }),
          ]),
      section({
        key: "faq",
        label: "Questions",
        fields: faqFields,
        defaults: {
          eyebrow: "",
          title: `Your *${sp.shortName}* questions, answered`,
          items: sp.faqs,
        },
      }),
      section({
        key: "closing",
        label: "Closing call to action",
        fields: {
          title: f.heading(),
          body: f.textarea("Body", { max: 300, rows: 2 }),
          image: f.image("Image"),
        },
        defaults: sp.closing as ServicePage["closing"],
      }),
      seoSection({
        title: plain(sp.hero.eyebrow),
        description: plain(sp.hero.body),
      }),
    ],
  });
}

export function servicePageKey(pillar: string, slug?: string) {
  return slug ? `service.${pillar}.${slug}` : `service.${pillar}`;
}

/** Page definitions for every group and service page (hidden ones too). */
export async function listServicePageDefs() {
  const catalog = await getFullCatalog();
  return catalog.flatMap((p) => [
    servicePageDef(basePillarPage(p.key), true, `${p.title} (overview)`),
    ...p.services
      .filter((sv) => !sv.externalHref)
      .map((sv) => servicePageDef(baseServicePage(p.key, sv), false, sv.title)),
  ]);
}

/** The page definition for "service.<pillar>[.<slug>]", or undefined. */
export async function resolveServicePageDef(key: string) {
  const [, pillar, slug] = key.split(".");
  const catalog = await getFullCatalog();
  const p = catalog.find((x) => x.key === pillar);
  if (!p) return undefined;
  if (!slug)
    return servicePageDef(basePillarPage(p.key), true, `${p.title} (overview)`);
  const sv = p.services.find((x) => x.slug === slug && !x.externalHref);
  return sv
    ? servicePageDef(baseServicePage(p.key, sv), false, sv.title)
    : undefined;
}

type ServiceSections = {
  hero: ServicePage["hero"];
  problem: ServicePage["problem"];
  trust: ServicePage["trust"];
  offerings: Partial<ServicePage["offerings"]> & {
    eyebrow: string;
    title: string;
    body: string;
  };
  techStack?: ServicePage["techStack"];
  useCases: ServicePage["useCases"];
  quality: ServicePage["quality"];
  process: ServicePage["process"];
  faq: { title: string; items: ServicePage["faqs"] };
  closing: ServicePage["closing"];
  related?: { title: string; count: number };
};

/**
 * A group or service page ready for ServicePageTemplate: the edited
 * sections, the group's services as cards, related services, and which
 * sections are hidden. Undefined if the page doesn't exist or is hidden.
 */
export async function loadServicePage(pillarKey: string, slug?: string) {
  const catalog = await getServiceCatalog();
  const pillar = catalog.find((x) => x.key === pillarKey) as
    | CatalogPillar
    | undefined;
  if (!pillar) return undefined;
  const service = slug
    ? pillar.services.find((x) => x.slug === slug && !x.externalHref)
    : undefined;
  if (slug && !service) return undefined;

  const base = service
    ? baseServicePage(pillar.key as PillarKey, service)
    : basePillarPage(pillar.key as PillarKey);
  const def = service
    ? servicePageDef(base, false, service.title)
    : servicePageDef(base, true, `${pillar.title} (overview)`);
  const { data, hidden } = await loadPage(def);
  const d = data as unknown as ServiceSections;

  const page: ServicePage = {
    ...base,
    hero: d.hero,
    problem: d.problem,
    trust: d.trust,
    offerings: {
      eyebrow: d.offerings.eyebrow,
      title: d.offerings.title,
      body: d.offerings.body,
      // Group pages list their services; service pages their own offerings.
      items: service ? (d.offerings.items ?? []) : serviceCards(pillar),
    },
    techStack: d.techStack ?? base.techStack,
    useCases: d.useCases,
    quality: d.quality,
    process: d.process,
    faqs: d.faq.items,
    closing: d.closing,
  };

  const relatedItems = service
    ? serviceCards(pillar, service.slug).slice(0, d.related?.count ?? 3)
    : [];
  return {
    def,
    page,
    hidden,
    faqTitle: d.faq.title,
    pillar,
    service,
    related:
      service && relatedItems.length > 0 && !hidden.related
        ? {
            title: d.related?.title ?? `Explore more *${pillar.key}* services`,
            items: relatedItems,
          }
        : undefined,
  };
}
