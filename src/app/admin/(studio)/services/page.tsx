import { requirePageAccess } from "@/lib/admin/session";
import { readCatalog } from "@/lib/services/catalog";
import { ensureServicesSeeded } from "@/lib/services/seed";
import { PageHeader } from "@/components/admin/kit/layout";
import { Callout } from "@/components/admin/kit/display";
import { ServicesManager } from "./services-manager";

export const metadata = { title: "Services" };

export default async function ServicesAdminPage() {
  await requirePageAccess("services");
  const seed = await ensureServicesSeeded();
  const catalog = seed.ready ? await readCatalog() : [];
  // Filled but unreadable (rows without ids mean the built-in fallback).
  const problem = !seed.ready
    ? seed
    : catalog.some((p) => !p.id)
      ? {
          reason: "error" as const,
          message: "the services tables couldn't be read.",
        }
      : null;

  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="Services and *menus*"
        description="Add, hide and reorder services. The Services menu, footer, Services page and each group's page update automatically. Edit a page's text from its Edit page button."
      />
      {problem ? (
        <Callout
          tone="warning"
          title={
            problem.reason === "stale-client"
              ? "Restart the site to finish setting up services"
              : problem.reason === "no-tables"
                ? "Services aren't set up yet"
                : "Services couldn't be set up"
          }
        >
          {problem.reason === "stale-client"
            ? "The database is ready, but the running site was started before the new services tables existed. Stop pnpm dev, start it again, and refresh this page."
            : problem.reason === "no-tables"
              ? "Run the database update for this release (prisma db push), restart the site, then refresh."
              : `Something went wrong while copying the current services: ${problem.message}`}{" "}
          Until then the site keeps using the built-in services.
        </Callout>
      ) : (
        <ServicesManager catalog={catalog} />
      )}
    </>
  );
}
