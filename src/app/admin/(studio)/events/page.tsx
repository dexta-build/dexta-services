import { requirePageAccess } from "@/lib/admin/session";
import { readEventsForAdmin } from "@/lib/events/admin";
import { PageHeader } from "@/components/admin/kit/layout";
import { Callout } from "@/components/admin/kit/display";
import { Button } from "@/components/site/button";
import { EventsManager } from "./events-manager";

export const metadata = { title: "Events" };

export default async function EventsAdminPage() {
  await requirePageAccess("events");
  const events = await readEventsForAdmin().catch(() => null);
  return (
    <>
      <PageHeader
        eyebrow="Events"
        title="Manage *events*"
        description="Each event's details, its registration form, how many seats it has and whether it's open."
        actions={
          <>
            <Button href="/admin/registrations" size="sm" variant="subtle">
              All registrations
            </Button>
            <Button href="/admin/pages/events" size="sm" variant="subtle" arrow>
              Events page
            </Button>
          </>
        }
      />
      {events ? (
        <EventsManager events={events} />
      ) : (
        <Callout tone="danger" title="Events couldn't be loaded">
          Refresh the page to try again.
        </Callout>
      )}
    </>
  );
}
