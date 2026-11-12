import prisma from "@/lib/prisma";
import { requirePageAccess } from "@/lib/admin/session";
import { PageHeader } from "@/components/admin/kit/layout";
import { Callout } from "@/components/admin/kit/display";
import { Button } from "@/components/site/button";
import { ClientsManager } from "./clients-manager";

export const metadata = { title: "Clients" };

export default async function ClientsAdminPage() {
  await requirePageAccess("works");
  const rows = await prisma.client
    .findMany({ orderBy: { position: "asc" } })
    .catch(() => null);

  return (
    <>
      <PageHeader
        eyebrow="Works"
        title="Client *logos*"
        description="The brands you've worked with. They appear after Our Expressions in the homepage logo strip and on the Works page."
        actions={
          <Button href="/admin/pages/works" size="sm" variant="subtle" arrow>
            Works page
          </Button>
        }
      />
      {rows ? (
        <ClientsManager
          clients={rows.map((c) => ({
            id: c.id,
            form: {
              name: c.name,
              logo: c.logoPublicId ?? "",
              websiteUrl: c.websiteUrl ?? "",
              isVisible: c.isVisible,
            },
          }))}
        />
      ) : (
        <Callout tone="danger" title="Clients couldn't be loaded">
          The database didn&apos;t answer. Refresh the page to try again.
        </Callout>
      )}
    </>
  );
}
