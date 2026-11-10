import "server-only";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { OFFERS_TAG } from "@/lib/offers-cache";
import type { OfferData } from "./offers-shared";

export * from "./offers-shared";

/**
 * Offers for the public site, from the standalone `Offer` table. Read with
 * plain SQL so it works before the table is pushed (until then: no offers,
 * and the page shows "No Offer available at this time"). Cached until the
 * admin saves an offer (tag "offers"); no polling.
 */

type OfferRow = {
  id: string;
  name: string;
  description: string;
  features: string;
  priceNGN: number | null;
  priceNote: string | null;
  badge: string | null;
  paymentLink: string | null;
  whatsappEnabled: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  isHighlighted: boolean;
};

function parseFeatures(raw: string): string[] {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value)
      ? value.filter((v): v is string => typeof v === "string" && !!v.trim())
      : [];
  } catch {
    return [];
  }
}

/** Only http(s) payment links are shown. */
function safeLink(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

/**
 * Development only: sample offers so the page can be reviewed before the
 * Offer table exists. Never used in production.
 */
function sampleOffers(): OfferData[] {
  const day = 86_400_000;
  const now = Date.now();
  const base = {
    startsAt: null,
    endsAt: null,
    highlighted: false,
    paymentLink: null,
    whatsappEnabled: true,
    badge: null,
  };
  return [
    {
      ...base,
      id: "sample-launch",
      name: "Launch bundle",
      description:
        "Everything a new business needs to show up well: a brand identity, a website and printed essentials.",
      features: [
        "Logo, colours and brand guide",
        "Five-page mobile-first website",
        "500 business cards and letterheads",
        "Social media profile kit",
      ],
      priceNGN: 450000,
      priceNote: "one-off",
      badge: "Sample · Bundle",
      endsAt: new Date(now + 4 * day + 6 * 3600_000).toISOString(),
      paymentLink: "https://paystack.com/pay/sample",
    },
    {
      ...base,
      id: "sample-growth",
      name: "Growth plan",
      description:
        "A monthly design and content team for brands that post, promote and print all the time.",
      features: [
        "Up to 20 designs each month",
        "Social content publishing, 5× a week",
        "Website updates included",
        "Priority turnaround",
      ],
      priceNGN: 120000,
      priceNote: "/ month",
      badge: "Sample · Best value",
      highlighted: true,
      paymentLink: "https://paystack.com/pay/sample",
    },
    {
      ...base,
      id: "sample-event",
      name: "Event print pack",
      description:
        "Matching invitations, programmes, banners and souvenirs for weddings, burials and big days.",
      features: [
        "100 invitation cards",
        "100 programme booklets",
        "One roll-up banner",
        "Free design and one revision",
      ],
      priceNGN: 280000,
      priceNote: "per event",
      badge: "Sample · 15% off",
      endsAt: new Date(now + 12 * day).toISOString(),
    },
    {
      ...base,
      id: "sample-custom",
      name: "Custom software",
      description:
        "Web apps, portals and mobile apps built around how your organisation actually works.",
      features: [
        "Discovery and planning workshop",
        "Design, build and launch",
        "Training for your team",
        "Three months of support",
      ],
      priceNGN: null,
      priceNote: null,
    },
  ];
}

async function readOffers(): Promise<OfferData[]> {
  try {
    const rows = await prisma.$queryRaw<OfferRow[]>`
      SELECT "id", "name", "description", "features", "priceNGN",
             "priceNote", "badge", "paymentLink", "whatsappEnabled",
             "startsAt", "endsAt", "isHighlighted"
      FROM "Offer"
      WHERE "isVisible" = true
      ORDER BY "position" ASC, "createdAt" ASC`;
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      features: parseFeatures(r.features),
      priceNGN: r.priceNGN,
      priceNote: r.priceNote?.trim() || null,
      badge: r.badge?.trim() || null,
      paymentLink: safeLink(r.paymentLink),
      whatsappEnabled: r.whatsappEnabled,
      startsAt: r.startsAt?.toISOString() ?? null,
      endsAt: r.endsAt?.toISOString() ?? null,
      highlighted: r.isHighlighted,
    }));
  } catch {
    // Table not pushed yet, or no database (e.g. a build without secrets).
    return process.env.NODE_ENV === "production" ? [] : sampleOffers();
  }
}

const readOffersCached = unstable_cache(readOffers, ["site-offers-v2"], {
  revalidate: false,
  tags: [OFFERS_TAG],
});

export async function getOffers(): Promise<OfferData[]> {
  return process.env.NODE_ENV === "development"
    ? readOffers()
    : readOffersCached();
}
