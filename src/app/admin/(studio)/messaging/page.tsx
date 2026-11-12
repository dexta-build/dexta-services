import prisma from "@/lib/prisma";
import { safeHtml } from "@/lib/email-html";
import { requirePageAccess } from "@/lib/admin/session";
import { PageHeader } from "@/components/admin/kit/layout";
import { Callout } from "@/components/admin/kit/display";
import { Button } from "@/components/site/button";
import { MessagingView, type Batch, type EventOption } from "./messaging-view";

export const metadata = { title: "Email attendees" };

async function readHistory(): Promise<Batch[] | null> {
  try {
    const rows = await prisma.outboundEmail.findMany({
      where: { kind: "BROADCAST" },
      orderBy: { createdAt: "desc" },
      include: { sentBy: { select: { name: true } } },
      take: 2000,
    });
    const batches = new Map<string, Batch>();
    for (const r of rows) {
      const id = r.batchId ?? r.id;
      const b = batches.get(id) ?? {
        id,
        subject: r.subject,
        body: safeHtml(r.body),
        files: Array.isArray(r.attachments)
          ? (
              r.attachments as {
                name?: string;
                url?: string;
                mode?: "attach" | "link";
              }[]
            )
              .filter((f) => f?.url)
              .map((f) => ({
                name: f.name ?? "File",
                url: f.url!,
                mode: f.mode ?? "attach",
              }))
          : [],
        eventId: r.eventId,
        sentAt: r.createdAt.toISOString(),
        by: r.sentBy?.name ?? "Someone",
        recipients: [],
      };
      b.recipients.push({
        email: r.toEmail,
        name: r.toName,
        failed: r.status === "FAILED",
        error: r.error ?? "",
      });
      batches.set(id, b);
    }
    return [...batches.values()];
  } catch {
    return null; // log table not in the database yet
  }
}

export default async function MessagingPage() {
  const user = await requirePageAccess("events");
  const [events, registrations, history] = await Promise.all([
    prisma.event.findMany({
      orderBy: { dateTime: "desc" },
      select: { id: true, title: true, dateTime: true, timezone: true },
    }),
    prisma.eventRegistration.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        eventId: true,
      },
    }),
    readHistory(),
  ]);

  const options: EventOption[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    when: e.dateTime.toLocaleDateString("en-GB", {
      timeZone: e.timezone,
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    past: e.dateTime.getTime() < Date.now(),
  }));

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Events", href: "/admin/events" },
          { label: "Email attendees" },
        ]}
        title="Email *attendees*"
        description="Send an announcement to the people registered for an event: a reminder, a change of venue, a thank-you. It's sent from the site, in the site's email design."
        actions={
          <Button href="/admin/registrations" size="sm" variant="subtle">
            Registrations
          </Button>
        }
      />
      {history === null && (
        <Callout
          tone="warning"
          title="Sending works; the history needs a database update"
          className="mb-6"
        >
          Announcements send as normal, but they won&apos;t be listed below
          until the database update for this release (prisma db push) is run.
        </Callout>
      )}
      <MessagingView
        events={options}
        registrations={registrations}
        history={history ?? []}
        meEmail={user.email}
      />
    </>
  );
}
