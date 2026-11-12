import { requirePageAccess } from "@/lib/admin/session";
import { readRegistrations } from "@/lib/events/admin";
import { PageHeader } from "@/components/admin/kit/layout";
import { Callout } from "@/components/admin/kit/display";
import { Button } from "@/components/site/button";
import { RegistrationsTable } from "../events/registrations-table";

export const metadata = { title: "Registrations" };

export default async function RegistrationsAdminPage() {
  await requirePageAccess("events");
  const data = await readRegistrations().catch(() => null);
  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Events", href: "/admin/events" },
          { label: "Registrations" },
        ]}
        title="All *registrations*"
        description="Everyone who signed up for any event. Accept or decline (each person is emailed), or export to a spreadsheet."
        actions={
          <Button href="/admin/events" size="sm" variant="subtle">
            Manage events
          </Button>
        }
      />
      {data ? (
        <RegistrationsTable
          registrations={data.registrations}
          fields={data.fields}
          events={data.events}
        />
      ) : (
        <Callout tone="danger" title="Registrations couldn't be loaded">
          Refresh the page to try again.
        </Callout>
      )}
    </>
  );
}
