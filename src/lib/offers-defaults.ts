export type OffersAudienceType =
  | "FOR_YOU"
  | "BUSINESS"
  | "SCHOOLS"
  | "CHURCHES";
export type BillingDuration =
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "YEARLY";
export type AudienceColor = "cyan" | "blue" | "purple" | "green";

// ── Page content ──────────────────────────────────────────────────────────────

export type OffersPageContentData = {
  heroEyebrow: string;
  heroHeadline: string;
  heroBody: string;
  heroBgImagePublicId: string | null;
  heroCtaText: string;
  heroCtaHref: string;
  servicesSectionLabel: string;
  servicesSectionTitle: string;
  servicesSectionBody: string;
  audienceSectionLabel: string;
  audienceSectionTitle: string;
  audienceSectionBody: string;
  popularBadgeText: string;
  featuresLabel: string;
  choosePlanText: string;
  requestQuoteText: string;
  ctaLabel: string;
  ctaTitle: string;
  ctaBody: string;
  cta1Text: string;
  cta1Href: string;
  cta2Text: string;
  cta2Href: string;
};

// ── Defaults ──────────────────────────────────────────────────────────────────

export const OFFERS_AUDIENCE_ORDER: OffersAudienceType[] = [
  "FOR_YOU",
  "BUSINESS",
  "SCHOOLS",
  "CHURCHES",
];

export const OFFERS_PAGE_CONTENT_DEFAULTS: OffersPageContentData = {
  heroEyebrow: "Dexta Offers",
  heroHeadline: "Reach More. Build More. Stay Visible.",
  heroBody:
    "Dexta helps businesses, schools, and organizations stay visible with design, web, print, and recurring communication support.",
  heroBgImagePublicId: null,
  heroCtaText: "Explore Offers",
  heroCtaHref: "#audiences",
  servicesSectionLabel: "What We Do",
  servicesSectionTitle: "Design, build, and print under one clear direction.",
  servicesSectionBody:
    "From visual identity to digital delivery and print production, Dexta helps teams show up clearly across every channel.",
  audienceSectionLabel: "Who We Serve",
  audienceSectionTitle: "Choose the path that fits your audience.",
  audienceSectionBody:
    "Each offer path is shaped around real communication needs, from customer growth to school visibility and community engagement.",
  popularBadgeText: "Popular Pick",
  featuresLabel: "Includes",
  choosePlanText: "Choose Offer",
  requestQuoteText: "Request Quote",
  ctaLabel: "Need a tailored offer?",
  ctaTitle: "Let's shape the right mix for your team.",
  ctaBody:
    "Need something between packages? We can build a custom scope around your goals, timeline, and operating rhythm.",
  cta1Text: "Start a Conversation",
  cta1Href: "/contact",
  cta2Text: "View Recent Projects",
  cta2Href: "/projects",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function parseJsonStringArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function serializeJsonStringArray(values: string[]): string {
  return JSON.stringify(
    values.map((value) => value.trim()).filter((value) => value.length > 0),
  );
}
