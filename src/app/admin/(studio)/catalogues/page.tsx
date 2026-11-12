import { requirePageAccess } from "@/lib/admin/session";
import {
  ensureCataloguesSeeded,
  readCataloguesForAdmin,
} from "@/lib/catalogue/admin";
import { PageHeader } from "@/components/admin/kit/layout";
import { Callout } from "@/components/admin/kit/display";
import { Button } from "@/components/site/button";
import { CataloguesManager } from "./catalogues-manager";

export const metadata = { title: "Catalogues" };

export default async function CataloguesAdminPage() {
  await requirePageAccess("catalogue");
  const seed = await ensureCataloguesSeeded();
  const catalogues = seed.ready ? await readCataloguesForAdmin() : [];

  return (
    <>
      <PageHeader
        eyebrow="Catalogues"
        title="Manage *catalogues*"
        description="Each catalogue's colour, hero, image and menu order, and the designs inside it. Drag to change the order in the menus, footer and homepage."
        actions={
          <Button
            href="/admin/pages/catalogue"
            size="sm"
            variant="subtle"
            arrow
          >
            Catalogues page
          </Button>
        }
      />
      {seed.ready ? (
        <CataloguesManager catalogues={catalogues} />
      ) : (
        <Callout tone="warning" title="Catalogues aren't set up yet">
          {seed.message} Until then the site keeps showing the built-in
          catalogues.
        </Callout>
      )}
    </>
  );
}
