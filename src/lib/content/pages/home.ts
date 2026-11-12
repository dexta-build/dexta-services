import "server-only";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import {
  HOME_ABOUT,
  HOME_ADVANTAGE,
  HOME_CATALOGUE,
  HOME_CLOSING,
  HOME_COMPARISON,
  HOME_DIFFERENCE,
  HOME_FALLBACK_HERO,
  HOME_LOGOS,
  HOME_NETWORK,
  HOME_PROCESS,
  HOME_SAMPLE_PROJECTS,
  HOME_SERVICES,
  HOME_SPLITS,
  HOME_STATS,
  HOME_TESTIMONIALS,
  HOME_WORKS,
} from "@/lib/site/home-content";
import {
  htmlToAccentText,
  manifestoToAccent,
  stripHtml,
} from "@/lib/site/home-data";
import { fetchSchoolWebsiteTestimonials } from "@/lib/api";
import { SERVICE_GROUPS } from "@/lib/site/navigation";
import { SERVICES } from "@/lib/site/services-content";
import { SHOWREEL_VIDEO, STOCK } from "@/lib/site/stock-media";
import { f } from "../fields";
import { page, section, seoSection } from "../define";
import { SURFACE_OPTIONS } from "../options";
import { closingSection } from "./shared";

/**
 * Content from the old homepage tables, used until a section is first
 * published. Cached with the old admin's tags, so it costs no database
 * work per visit and still follows edits made in the old screens. old screen were removed.
 */
const legacy = <T>(key: string, tag: string, load: () => Promise<T>) => {
  const cached = unstable_cache(load, [`home-legacy-${key}`], {
    revalidate: false,
    tags: [tag],
  });
  return async () => {
    try {
      return await (process.env.NODE_ENV === "development" ? load() : cached());
    } catch {
      return load();
    }
  };
};

const hero = section({
  key: "hero",
  label: "Hero",
  description: "The big headline at the top of the homepage.",
  canHide: false,
  fields: {
    headline: f.heading("Headline"),
    body: f.textarea("Intro", { max: 300, rows: 3 }),
    primaryLabel: f.text("Main button text", {
      max: 40,
      hint: "Opens WhatsApp with the general message (or the contact page).",
    }),
    ctaText: f.text("Second button text", { max: 40 }),
    ctaHref: f.url("Second button goes to"),
  },
  defaults: legacy("hero", "hero-content", async () => {
    const row = await prisma.heroContent.findFirst().catch(() => null);
    if (!row) return { ...HOME_FALLBACK_HERO, primaryLabel: "Start a project" };
    return {
      primaryLabel: "Start a project",
      headline: htmlToAccentText(row.headline) || HOME_FALLBACK_HERO.headline,
      body: stripHtml(row.body) || HOME_FALLBACK_HERO.body,
      ctaText: row.ctaText || HOME_FALLBACK_HERO.ctaText,
      ctaHref: row.ctaHref === "/projects" ? "/works" : row.ctaHref || "/works",
    };
  }),
});

const GROUP_OPTIONS = [
  { value: "DESIGN", label: "Design" },
  { value: "BUILD", label: "Build" },
  { value: "PRINT", label: "Print" },
];

/**
 * The sample projects' old "Wedding · Print" labels as group, service and
 * occasion, so the hand-picked list starts with the same meaning.
 */
function classify(category: string, pillar: "DESIGN" | "BUILD" | "PRINT") {
  const first = category.split("·")[0].trim();
  const groups = ["Design", "Build", "Print"];
  const service = SERVICES.find(
    (sv) =>
      sv.pillar === pillar.toLowerCase() &&
      sv.hero.eyebrow
        .replace(/\*/g, "")
        .toLowerCase()
        .startsWith(first.toLowerCase().replace(/s$/, "")),
  );
  const occasionMap: Record<string, string> = {
    Wedding: "Wedding",
    Events: "Events",
    Birthdays: "Birthday",
    Education: "Education",
    Corporate: "Corporate",
  };
  return {
    group: pillar as string,
    service: service ? `${service.pillar}/${service.slug}` : "",
    occasion: groups.includes(first) ? "" : (occasionMap[first] ?? ""),
  };
}

/** The service each sample project is really about. */
const SAMPLE_SERVICES: Record<string, string> = {
  "sample-wedding": "print/invitation-cards",
  "sample-launch": "design/brand-identity",
  "sample-identity": "design/brand-identity",
  "sample-store": "build/e-commerce",
  "sample-birthday": "print/invitation-cards",
  "sample-portal": "build/websites",
  "sample-corporate": "print/branded-merchandise",
  "sample-booking": "build/mobile-apps",
  "sample-gala": "print/banners-signage",
  "sample-social": "design/social-media-creative",
};

const showcase = section({
  key: "showcase",
  label: "Showcase projects",
  description:
    "The project tiles moving beside the hero. Tapping a tile on the site opens its gallery.",
  canHide: false,
  fields: {
    source: f.select(
      "Show",
      [
        { value: "custom", label: "The hand-picked projects below" },
        { value: "works", label: "Projects from Works (featured first)" },
      ],
      {
        hint: "Projects from Works need images. If there are none, the hand-picked list is used.",
      },
    ),
    limit: f.number("How many projects", { min: 4, max: 24 }),
    projects: f.list(
      "Hand-picked projects",
      "Project",
      {
        title: f.text("Title", { max: 80 }),
        group: f.select("Service group", GROUP_OPTIONS),
        service: f.select("Service", [], {
          optional: true,
          optionsFrom: "services",
          dependsOn: "group",
          hint: "Lists the services in the chosen group.",
        }),
        occasion: f.select("Occasion", [], {
          optional: true,
          optionsFrom: "occasions",
          hint: "Edit the list in Site settings → Project occasions.",
        }),
        tags: f.strings("Tags", { max: 6, addLabel: "Add a tag" }),
        description: f.textarea("Description", { max: 400, rows: 3 }),
        images: f.images("Images and videos", {
          max: 20,
          videos: true,
          hint: "The first one is the tile; the rest show in the gallery. Add, replace, reorder or remove any of them.",
        }),
      },
      { titleKey: "title", max: 24 },
    ),
  },
  defaults: {
    source: "custom",
    limit: 12,
    projects: HOME_SAMPLE_PROJECTS.map((p) => ({
      id: p.id,
      title: p.title,
      ...classify(p.category, p.pillar),
      ...(SAMPLE_SERVICES[p.id] ? { service: SAMPLE_SERVICES[p.id] } : {}),
      tags: p.tags,
      description: p.description,
      images: p.images as string[],
    })),
  },
});

const logos = section({
  key: "logos",
  label: "Logo strip",
  description:
    "The line above the client and product logos. Logos themselves come from Works & products.",
  fields: { title: f.text("Line above the logos", { max: 160 }) },
  defaults: HOME_LOGOS,
});

const manifesto = section({
  key: "manifesto",
  label: "Manifesto",
  description: "The large statement under the logos.",
  fields: {
    text: f.accent("Statement", { max: 400, multiline: true, optional: true }),
  },
  defaults: legacy("manifesto", "manifesto-content", async () => {
    const row = await prisma.manifestoContent.findFirst().catch(() => null);
    return { text: row?.text ? manifestoToAccent(row.text) : "" };
  }),
});

const about = section({
  key: "about",
  label: "Who we are",
  fields: {
    eyebrow: f.eyebrow(),
    title: f.heading(),
    lead: f.textarea("Lead", { max: 400, rows: 3 }),
    body: f.textarea("Body", { max: 600, rows: 3 }),
    cta: f.link("Button"),
    image: f.image("Image"),
    imageAlt: f.text("Image description", {
      max: 160,
      hint: "Read aloud by screen readers.",
    }),
  },
  defaults: { ...HOME_ABOUT, imageAlt: "The Dexta team at work" },
});

const advantage = section({
  key: "advantage",
  label: "Creative advantage",
  description: "The showreel block with rotating words and images.",
  fields: {
    eyebrow: f.eyebrow(),
    title: f.heading(),
    lead: f.textarea("Lead", { max: 400, rows: 3 }),
    body: f.textarea("Body", { max: 600, rows: 3 }),
    cta: f.link("Button"),
    teaserWords: f.strings("Rotating words", { max: 6 }),
    teaserImages: f.images("Rotating images", { max: 12 }),
    video: f.video("Showreel video", {
      hint: "Plays when someone taps the teaser.",
    }),
  },
  defaults: {
    ...HOME_ADVANTAGE,
    teaserImages: HOME_ADVANTAGE.teaserImages as string[],
    video: SHOWREEL_VIDEO as string,
  },
});

const CARD_COLOURS = [
  { value: "bg-brand-cyan text-royal", label: "Cyan" },
  { value: "bg-ocean-deep text-white", label: "Ocean" },
  { value: "bg-ice text-royal", label: "Ice blue" },
  { value: "bg-royal text-ice", label: "Royal blue" },
  { value: "bg-gold text-royal", label: "Gold" },
  { value: "bg-white text-royal", label: "White" },
];

const SERVICE_KEYS = ["DESIGN", "BUILD", "PRINT"] as const;

const services = section({
  key: "services",
  label: "What we do",
  description: "The service cards: Design, Build and Print.",
  fields: {
    eyebrow: f.eyebrow(),
    title: f.heading(),
    cards: f.list(
      "Cards",
      "Card",
      {
        headline: f.accent("Headline", { max: 80 }),
        description: f.textarea("Description", { max: 300, rows: 2 }),
        image: f.image("Image"),
        linkLabel: f.text("Link text", { max: 40 }),
        href: f.url("Goes to"),
        colour: f.select("Panel colour", CARD_COLOURS),
      },
      { titleKey: "headline", max: 6 },
    ),
  },
  defaults: legacy("services", "services-content", async () => {
    // Descriptions used to be edited in the old "Project section" screen.
    const rows = await prisma.serviceContent.findMany().catch(() => []);
    return {
      eyebrow: HOME_SERVICES.eyebrow,
      title: HOME_SERVICES.title,
      cards: SERVICE_KEYS.map((key, i) => {
        const group = SERVICE_GROUPS.find((g) => g.key === key.toLowerCase());
        return {
          headline: HOME_SERVICES.headlines[key],
          description:
            rows.find((r) => r.type === key)?.description ||
            HOME_SERVICES.fallbackDescriptions[key],
          image: HOME_SERVICES.images[key] as string,
          linkLabel: `Explore ${group?.title ?? "service"}`,
          href: group?.href ?? "/services",
          colour: HOME_SERVICES.panels[i],
        };
      }),
    };
  }),
});

const stats = section({
  key: "stats",
  label: "By the numbers",
  fields: {
    eyebrow: f.eyebrow(),
    title: f.heading(),
    items: f.list(
      "Numbers",
      "Number",
      {
        value: f.number("Number", { min: 0 }),
        suffix: f.text("After the number", {
          max: 4,
          optional: true,
          hint: "e.g. + or %",
        }),
        label: f.text("What it counts", { max: 120 }),
      },
      { titleKey: "label", max: 6 },
    ),
  },
  defaults: HOME_STATS,
});

const network = section({
  key: "network",
  label: "Our services network",
  description: "The cloud of service chips and the people we serve.",
  fields: {
    eyebrow: f.eyebrow(),
    title: f.heading(),
    chips: f.list(
      "Service chips",
      "Chip",
      {
        label: f.text("Text", { max: 40 }),
        href: f.url("Goes to"),
        image: f.image("Thumbnail", { optional: true }),
      },
      { titleKey: "label", max: 40 },
    ),
    audiences: f.list(
      "People we serve",
      "Audience",
      { label: f.text("Label", { max: 30 }), image: f.image("Photo") },
      {
        titleKey: "label",
        max: 12,
        hint: "Positions on the page stay as designed.",
      },
    ),
  },
  defaults: HOME_NETWORK,
});

const works = section({
  key: "works",
  label: "Featured works",
  description: "Heading for the featured projects. Projects come from Works.",
  fields: {
    eyebrow: f.eyebrow(),
    title: f.heading(),
    count: f.number("How many projects", { min: 3, max: 12 }),
    cta: f.link("Button"),
  },
  defaults: { ...HOME_WORKS, count: 6 },
});

const catalogue = section({
  key: "catalogue",
  label: "Catalogues showcase",
  description:
    "Heading and button. The catalogues themselves come from Catalogues.",
  fields: {
    eyebrow: f.eyebrow(),
    title: f.heading(),
    body: f.textarea("Body", { max: 300, rows: 2 }),
    buttonLabel: f.text("Button text", {
      max: 60,
      hint: "{catalogue} becomes the name of the chosen catalogue.",
    }),
  },
  defaults: {
    ...HOME_CATALOGUE,
    buttonLabel: "Explore the {catalogue} catalogue",
  },
});

const offers = section({
  key: "offers",
  label: "Offers band",
  description:
    "Shown only while there are dated offers running. The offers come from Offers.",
  fields: {
    eyebrow: f.eyebrow(),
    title: f.heading(),
    linkLabel: f.text("Link text", { max: 40 }),
    badgeFallback: f.text("Badge when an offer has none", { max: 20 }),
    customQuoteLabel: f.text("Shown when an offer has no price", { max: 30 }),
  },
  defaults: {
    eyebrow: "Limited-time offers",
    title: "Special offers, *while they last*",
    linkLabel: "See all offers",
    badgeFallback: "Offer",
    customQuoteLabel: "Custom quote",
  },
});

const comparison = section({
  key: "comparison",
  label: "Comparison table",
  fields: {
    eyebrow: f.eyebrow(),
    title: f.heading(),
    columns: f.strings("Columns", { max: 8 }),
    rows: f.list(
      "Rows",
      "Row",
      {
        name: f.text("Name", { max: 40 }),
        note: f.text("Note", { max: 160 }),
        values: f.booleans("Has it", "columns"),
        highlight: f.toggle("Highlight this row", { optional: true }),
      },
      { titleKey: "name", max: 8 },
    ),
  },
  defaults: HOME_COMPARISON,
});

const testimonials = section({
  key: "testimonials",
  label: "Testimonials",
  description:
    "The wall of quotes. It starts with the We Brand Schools testimonials.",
  fields: {
    eyebrow: f.eyebrow(),
    title: f.heading(),
    items: f.list(
      "Quotes",
      "Quote",
      {
        quote: f.textarea("Quote", { max: 600, rows: 3 }),
        author: f.text("Name", { max: 80 }),
        role: f.text("Role", { max: 80, optional: true }),
        company: f.text("Company or school", { max: 100, optional: true }),
        logo: f.image("Logo", { optional: true }),
      },
      { titleKey: "author", max: 24 },
    ),
  },
  defaults: async () => {
    const rows = await fetchSchoolWebsiteTestimonials().catch(() => []);
    return {
      ...HOME_TESTIMONIALS,
      items: rows.map((t) => ({
        quote: t.quote,
        author: t.authorName,
        role: t.authorPosition,
        company: t.schoolName,
        logo: t.logoPublicId ?? "",
      })),
    };
  },
});

const processSection = section({
  key: "process",
  label: "How it works",
  description:
    "The bento grid: WhatsApp chat, progress, brand kit and currencies.",
  fields: {
    eyebrow: f.eyebrow(),
    title: f.heading(),
    body: f.textarea("Body", { max: 300, rows: 2 }),
    primary: f.link("Main button"),
    secondary: f.link("Second button"),
    chat: f.object("WhatsApp card", {
      image: f.image("Background image"),
      title: f.heading("Title"),
      caption: f.text("Caption", { max: 160 }),
      messages: f.list(
        "Chat messages",
        "Message",
        {
          from: f.select("From", [
            { value: "client", label: "Client" },
            { value: "dexta", label: "Dexta" },
          ]),
          text: f.text("Message", { max: 160 }),
        },
        { titleKey: "text", max: 8 },
      ),
    }),
    progress: f.object("Progress card", {
      image: f.image("Background image"),
      title: f.heading("Title"),
      body: f.textarea("Body", { max: 300, rows: 2 }),
      steps: f.strings("Steps", { max: 6 }),
    }),
    brandKit: f.object("Brand kit card", {
      imageA: f.image("First image"),
      imageB: f.image("Second image"),
      title: f.heading("Title"),
      body: f.textarea("Body", { max: 200, rows: 2 }),
    }),
    currency: f.object("Currency card", {
      title: f.heading("Title"),
      body: f.textarea("Body", { max: 200, rows: 2 }),
    }),
  },
  defaults: {
    ...HOME_PROCESS,
    primary: { label: "Start a project", href: "/contact" },
    secondary: { label: "Browse catalogues", href: "/catalogue" },
    chat: { ...HOME_PROCESS.chat, image: STOCK.friendsSunset as string },
    progress: {
      ...HOME_PROCESS.progress,
      image: STOCK.teamWhiteboard as string,
    },
    brandKit: {
      ...HOME_PROCESS.brandKit,
      imageA: STOCK.colourSwatches as string,
      imageB: STOCK.typeOnTablet as string,
    },
  },
});

const difference = section({
  key: "difference",
  label: "Our difference",
  fields: {
    eyebrow: f.eyebrow(),
    title: f.heading(),
    items: f.list(
      "Points",
      "Point",
      {
        icon: f.select("Icon", [
          { value: "gem", label: "Gem" },
          { value: "zap", label: "Lightning" },
          { value: "layers", label: "Layers" },
          { value: "globe", label: "Globe" },
        ]),
        label: f.text("Label", { max: 30 }),
        title: f.text("Title", { max: 60 }),
        body: f.textarea("Body", { max: 200, rows: 2 }),
      },
      { titleKey: "title", max: 6 },
    ),
  },
  defaults: HOME_DIFFERENCE,
});

const splits = section({
  key: "splits",
  label: "Colour blocks",
  description: "The two large coloured blocks near the end.",
  fields: {
    items: f.list(
      "Blocks",
      "Block",
      {
        surface: f.select("Colour", SURFACE_OPTIONS),
        eyebrow: f.eyebrow(),
        title: f.heading(),
        lead: f.textarea("Lead", { max: 300, rows: 2 }),
        body: f.textarea("Body", { max: 400, rows: 2 }),
        cta: f.link("Button"),
        image: f.image("Image"),
      },
      { titleKey: "eyebrow", max: 4 },
    ),
  },
  defaults: {
    items: HOME_SPLITS.map((s) => ({ ...s, surface: s.surface as string })),
  },
});

export const HOME_PAGE = page({
  key: "home",
  label: "Homepage",
  path: "/",
  area: "home",
  group: "Pages",
  sections: [
    hero,
    showcase,
    logos,
    manifesto,
    about,
    services,
    stats,
    advantage,
    network,
    works,
    catalogue,
    offers,
    comparison,
    testimonials,
    processSection,
    difference,
    splits,
    closingSection(HOME_CLOSING),
    seoSection({
      title: "Dexta Synergy Services",
      description:
        "Design, software and print for brands, businesses and life's big moments, from one creative team in Port Harcourt, Nigeria.",
    }),
  ],
});
