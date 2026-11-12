import "server-only";
import prisma from "@/lib/prisma";
import { loadPage } from "@/lib/content/store";
import { SITE_PAGE } from "@/lib/content/pages/site";
import { builtInCatalog } from "./catalog";

/**
 * Fills the tables from the current menu and service pages the first time
 * (uses the Services menu as last published in Site settings, if any).
 * Safe to call again: does nothing once there are groups.
 */
export type SeedResult =
  | { ready: true }
  | {
      ready: false;
      reason: "stale-client" | "no-tables" | "error";
      message: string;
    };

/** Does the loaded Prisma client know about the services tables? */
function clientHasServices() {
  return (
    typeof (prisma as unknown as { servicePillar?: unknown }).servicePillar ===
    "object"
  );
}

async function countPillars() {
  try {
    return await prisma.servicePillar.count();
  } catch {
    return 0;
  }
}

export async function ensureServicesSeeded(): Promise<SeedResult> {
  // The dev server keeps the Prisma client it started with; after a schema
  // change it doesn't know the new tables until it's restarted.
  if (!clientHasServices()) {
    return {
      ready: false,
      reason: "stale-client",
      message:
        "The running site was started before the services tables existed.",
    };
  }
  try {
    if ((await prisma.servicePillar.count()) > 0) return { ready: true };
    const { data } = await loadPage(SITE_PAGE);
    const header = data.header as unknown as {
      serviceGroups?: Parameters<typeof builtInCatalog>[0];
    };
    const catalog = builtInCatalog(
      header.serviceGroups?.length ? header.serviceGroups : undefined,
    );
    await prisma.$transaction(
      catalog.map((p, pi) =>
        prisma.servicePillar.create({
          data: {
            key: p.key,
            title: p.title,
            pillClass: p.pillClass,
            position: pi,
            services: {
              create: p.services.map((s, si) => ({
                slug: s.slug,
                title: s.title,
                shortName: s.shortName,
                description: s.description,
                icon: s.icon,
                cardImage: s.cardImage,
                externalHref: s.externalHref,
                position: si,
              })),
            },
          },
        }),
      ),
    );
    return { ready: true };
  } catch (error) {
    // Another request may have filled them at the same moment.
    if ((await countPillars()) > 0) return { ready: true };
    const message = (error as Error).message ?? "";
    console.warn("[services] could not fill tables:", message);
    const missing = /does not exist|P2021/i.test(message);
    return { ready: false, reason: missing ? "no-tables" : "error", message };
  }
}
