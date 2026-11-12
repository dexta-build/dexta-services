import "server-only";
import { fetchContactPageContent, fetchContactSocialLinks } from "@/lib/api";
import {
  FOOTER_COMPANY_LINKS,
  MAIN_LINKS,
  PRIMARY_CTA,
  RESOURCES,
  RESOURCES_AFTER,
} from "@/lib/site/navigation";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site/site-url";
import { f } from "../fields";
import { page, section } from "../define";
import { ICON_OPTIONS } from "../options";

const PLATFORMS = [
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "X", label: "X (Twitter)" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "YOUTUBE", label: "YouTube" },
  { value: "TIKTOK", label: "TikTok" },
];

export const business = section({
  key: "business",
  label: "Business details",
  description:
    "Phone numbers, emails, address, WhatsApp and social links, used across the site.",
  canHide: false,
  fields: {
    address: f.textarea("Address", { rows: 2, max: 300 }),
    phones: f.strings("Phone numbers", {
      addLabel: "Add a phone number",
      hint: "The first one is shown in the footer.",
    }),
    emails: f.strings("Email addresses", {
      addLabel: "Add an email",
      hint: "The first one is shown in the footer.",
    }),
    whatsappNumber: f.text("WhatsApp number", {
      optional: true,
      max: 30,
      placeholder: "+234 810 000 0000",
      hint: "Leave empty to use the first phone number. A WhatsApp link below takes priority.",
    }),
    socials: f.list(
      "Social links",
      "Social link",
      {
        platform: f.select("Platform", PLATFORMS),
        label: f.text("Label", { max: 40 }),
        href: f.url("Link"),
        isVisible: f.toggle("Show on the site"),
      },
      { titleKey: "label" },
    ),
  },
  defaults: async () => {
    const [c, socials] = await Promise.all([
      fetchContactPageContent(),
      fetchContactSocialLinks(),
    ]);
    return {
      address: c.address,
      phones: c.phones,
      emails: c.emails,
      whatsappNumber: "",
      socials: socials.map((s) => ({
        platform: s.platform as string,
        label: s.label,
        href: s.href,
        isVisible: s.isVisible,
      })),
    };
  },
});

export const whatsapp = section({
  key: "whatsapp",
  label: "WhatsApp messages",
  description:
    "The message that's pre-filled when someone taps a WhatsApp button. Words in {curly braces} are filled in automatically.",
  canHide: false,
  fields: {
    general: f.text("Most buttons (header, homepage, contact)", { max: 200 }),
    about: f.text("About page", { max: 200 }),
    services: f.text("Services page", { max: 200 }),
    servicePillar: f.text("Design, Build and Print pages", {
      max: 200,
      hint: "{service} becomes e.g. “design”.",
    }),
    service: f.text("Individual service pages", {
      max: 200,
      hint: "{service} becomes the service name.",
    }),
    works: f.text("Works page", { max: 200 }),
    work: f.text("A project page", {
      max: 200,
      hint: "{title} becomes the project name.",
    }),
    catalogues: f.text("Catalogues page", { max: 200 }),
    catalogue: f.text("A catalogue page", {
      max: 200,
      hint: "{catalogue} becomes the catalogue name.",
    }),
    offers: f.text("Offers page", { max: 200 }),
    events: f.text("Events page", { max: 200 }),
    thoughts: f.text("Thoughts and articles", { max: 200 }),
    expressions: f.text("Our Expressions", { max: 200 }),
  },
  defaults: {
    general: "Hello Dexta, I'd like to start a project.",
    about: "Hello Dexta, I'd like to talk about a project.",
    services: "Hello Dexta, I'd like to talk about your services.",
    servicePillar: "Hello Dexta, I'd like to talk about {service} services.",
    service: "Hello Dexta, I'd like to talk about {service}.",
    works: "Hello Dexta, I saw your work and I'd like to start a project.",
    work: 'Hello Dexta, I saw "{title}" and I\'d like something similar.',
    catalogues: "Hello Dexta, I'd like to order from your catalogues.",
    catalogue: "Hello Dexta, I'm looking at the {catalogue} catalogue.",
    offers: "Hello Dexta, I'd like to ask about your offers.",
    events: "Hello Dexta, I'd like to know about your events.",
    thoughts: "Hello Dexta, I read one of your articles and...",
    expressions: "Hello Dexta, I have a product idea I'd like to build.",
  },
});

const linkItem = { label: f.text("Text", { max: 40 }), href: f.url("Goes to") };
const menuItem = {
  title: f.text("Title", { max: 60 }),
  description: f.text("Short description", { max: 80 }),
  href: f.url("Goes to"),
  icon: f.select("Icon", ICON_OPTIONS),
};

export const header = section({
  key: "header",
  label: "Header menus",
  description:
    "The menus at the top of every page and the main button. The Services menu lists the services from the Services screen, and the Catalogues menu the catalogues from the Catalogues screen.",
  canHide: false,
  fields: {
    labels: f.object("Menu names", {
      services: f.text("Services menu", { max: 30 }),
      catalogues: f.text("Catalogues menu", { max: 30 }),
      resources: f.text("Resources menu", { max: 30 }),
      cataloguesList: f.text("Catalogues menu: list heading", { max: 40 }),
      cataloguesFeatured: f.text("Catalogues menu: cards heading", {
        max: 40,
        hint: "Above the featured catalogues (set in Catalogues).",
      }),
      cataloguesAll: f.text("Catalogues menu: all catalogues link", {
        max: 40,
      }),
    }),
    mainLinks: f.list("Main links", "Link", linkItem, {
      titleKey: "label",
      max: 6,
      hint: "Shown after the Services and Catalogues menus.",
    }),
    resourcesAfter: f.url("Resources menu goes after", {
      hint: "The main link (by its address) that the Resources menu follows, e.g. /works.",
    }),
    resources: f.list("Resources menu", "Resource", menuItem, {
      titleKey: "title",
      max: 8,
    }),
    cta: f.link("Main button"),
  },
  defaults: {
    labels: {
      services: "Services",
      catalogues: "Catalogues",
      resources: "Resources",
      cataloguesList: "Our catalogues",
      cataloguesFeatured: "Featured",
      cataloguesAll: "Browse all catalogues",
    },
    mainLinks: MAIN_LINKS,
    resourcesAfter: RESOURCES_AFTER,
    resources: RESOURCES.map((r) => ({ ...r, icon: r.icon as string })),
    cta: PRIMARY_CTA,
  },
});

export const footer = section({
  key: "footer",
  label: "Footer",
  description:
    "The footer at the bottom of every page. Service and catalogue columns follow the header menus.",
  canHide: false,
  fields: {
    blurb: f.textarea("About line", { max: 200, rows: 2 }),
    whatsappLabel: f.text("WhatsApp link text", { max: 40 }),
    cataloguesTitle: f.text("Catalogues column title", { max: 30 }),
    companyTitle: f.text("Company column title", { max: 30 }),
    companyLinks: f.list("Company links", "Link", linkItem, {
      titleKey: "label",
      max: 12,
    }),
    copyright: f.text("Copyright line", {
      max: 120,
      hint: "{year} becomes the current year.",
    }),
  },
  defaults: {
    blurb:
      "A creative agency for design, software and print, helping brands and life's big moments look their best.",
    whatsappLabel: "Chat on WhatsApp",
    cataloguesTitle: "Catalogues",
    companyTitle: "Company",
    companyLinks: FOOTER_COMPANY_LINKS,
    copyright: "© {year} Dexta Synergy Services. All rights reserved.",
  },
});

export const seoDefaults = section({
  key: "seo",
  label: "Search & sharing defaults",
  description:
    "Used by every page that doesn't set its own. Also sets the site's address for links and the sitemap.",
  canHide: false,
  fields: {
    siteName: f.text("Site name", {
      max: 60,
      hint: "Added after each page title, e.g. “Works | Dexta Synergy Services”.",
    }),
    description: f.textarea("Default description", { max: 200, rows: 3 }),
    image: f.image("Default share image", {
      optional: true,
      hint: "1200 × 630. Leave empty to use the generated Dexta card.",
    }),
    siteUrl: f.url("Site address", {
      hint: "The live address, e.g. https://www.dexta.services. Used for canonical links, the sitemap and share previews.",
    }),
  },
  defaults: {
    siteName: SITE_NAME,
    description: SITE_DESCRIPTION,
    image: "",
    siteUrl: SITE_URL,
  },
});

export const DEFAULT_OCCASIONS = [
  "Wedding",
  "Birthday",
  "Burial & memorial",
  "Events",
  "Corporate",
  "Education",
  "Church & faith",
  "Retail & e-commerce",
  "Hospitality",
  "Real estate",
  "Health",
  "Personal brand",
];

export const taxonomy = section({
  key: "taxonomy",
  label: "Project occasions",
  description:
    "The occasions or sectors a project can be tagged with (Wedding, Events, Education…). Used by the homepage showcase and, later, every project.",
  canHide: false,
  fields: {
    occasions: f.strings("Occasions", {
      addLabel: "Add an occasion",
      max: 40,
      hint: "Renaming one here doesn't update projects that already use the old name.",
    }),
  },
  defaults: { occasions: DEFAULT_OCCASIONS },
});

export const SITE_PAGE = page({
  key: "site",
  label: "Site settings",
  path: null,
  area: "settings",
  group: "Site-wide",
  description: "Business details, WhatsApp, menus, footer and search defaults.",
  sections: [business, whatsapp, header, footer, seoDefaults, taxonomy],
});
