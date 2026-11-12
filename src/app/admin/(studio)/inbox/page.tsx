import { redirect } from "next/navigation";
import { requirePageAccess } from "@/lib/admin/session";
import {
  canUseInbox,
  inboxAccess,
  readAssignees,
  readInbox,
} from "@/lib/inbox/inbox";
import { PageHeader } from "@/components/admin/kit/layout";
import { Callout } from "@/components/admin/kit/display";
import { InboxView } from "./inbox-view";

export const metadata = { title: "Inbox" };

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ assigned?: string; item?: string }>;
}) {
  const user = await requirePageAccess(null);
  if (!canUseInbox(user)) redirect("/admin?denied=inbox");
  const [{ assigned, item }, data, people] = await Promise.all([
    searchParams,
    readInbox(user).catch(() => null),
    readAssignees().catch(() => []),
  ]);
  const access = inboxAccess(user);

  return (
    <>
      <PageHeader
        eyebrow="Inbox"
        title="Your *inbox*"
        description={`Everything people send you in one place: ${[
          access.MESSAGE && "contact messages",
          access.REGISTRATION && "event registrations",
          access.APPLICATION && "We Brand Schools applications",
        ]
          .filter(Boolean)
          .join(", ")}. Reply by email or WhatsApp, assign, and mark done.`}
      />
      {!data ? (
        <Callout tone="danger" title="The inbox couldn't be loaded">
          Refresh the page to try again.
        </Callout>
      ) : (
        <>
          {!data.stateReady && (
            <Callout
              tone="warning"
              title="Read, done and assigned need a database update"
              className="mb-6"
            >
              Everything shows, but marking items or assigning them won&apos;t
              save until the database update for this release (prisma db push)
              is run.
            </Callout>
          )}
          <InboxView
            items={data.items}
            people={people}
            meId={user.id}
            meName={user.name}
            access={access}
            initialAssigned={assigned === "me" ? "me" : undefined}
            initialItem={item}
          />
        </>
      )}
    </>
  );
}
