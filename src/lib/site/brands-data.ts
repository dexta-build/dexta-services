import "server-only";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { getExpressions } from "./expressions-data";
import { imageUrl } from "./media";

/**
 * Logos for the homepage logo strip and the Works brands wall: Dexta's own
 * products ("Our Expressions") followed by client logos (Client table).
 * Cached until the admin saves either list; no polling.
 */

export const CLIENTS_TAG = "clients-content";

export type BrandLogo = {
  id: string;
  name: string;
  url: string | null;
  /** Wide logo image (clients). */
  logo: string | null;
  /** Square icon shown beside the name (products). */
  icon: string | null;
  kind: "product" | "client";
  /** Development-only placeholder client. */
  sample?: boolean;
};

/**
 * Development preview only, so the client logos can be seen before any are
 * added in the admin. These are schools listed on DX-SchoolPortal; they are
 * never shown in production.
 */
const SAMPLE_CLIENTS = [
  "BAMBAM Academy",
  "City International School",
  "PNEUMA Academy",
  "Sailors' Pride School",
  "Sheerwood International School",
];

async function loadClients(): Promise<BrandLogo[]> {
  const dev = process.env.NODE_ENV !== "production";
  try {
    const rows = await prisma.client.findMany({
      where: { isVisible: true },
      orderBy: { position: "asc" },
      select: { id: true, name: true, logoPublicId: true, websiteUrl: true },
    });
    if (rows.length > 0 || !dev) {
      return rows.map((c) => ({
        id: `client-${c.id}`,
        name: c.name,
        url: c.websiteUrl || null,
        logo: c.logoPublicId ? imageUrl(c.logoPublicId, 320) : null,
        icon: null,
        kind: "client" as const,
      }));
    }
  } catch {
    if (!dev) return [];
  }
  return SAMPLE_CLIENTS.map((name, i) => ({
    id: `sample-client-${i}`,
    name,
    url: null,
    logo: null,
    icon: null,
    kind: "client" as const,
    sample: true,
  }));
}

async function loadBrandLogos(): Promise<BrandLogo[]> {
  const [products, clients] = await Promise.all([
    getExpressions(),
    loadClients(),
  ]);
  return [
    ...products.map((p) => ({
      id: `product-${p.slug}`,
      name: p.name,
      url: `/expressions/${p.slug}`,
      logo: null,
      icon: p.icon,
      kind: "product" as const,
    })),
    ...clients,
  ];
}

const loadBrandLogosCached = unstable_cache(loadBrandLogos, ["brand-logos"], {
  revalidate: false,
  tags: ["expressions-content", CLIENTS_TAG],
});

export function getBrandLogos(): Promise<BrandLogo[]> {
  return process.env.NODE_ENV === "development"
    ? loadBrandLogos()
    : loadBrandLogosCached();
}
