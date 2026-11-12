"use server";

import { randomUUID } from "node:crypto";
import { createElement } from "react";
import { render } from "@react-email/render";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/admin/audit";
import {
  AdminAuthError,
  requireAdmin,
  type AdminActor,
} from "@/lib/admin/session";
import { eventDetails, sendTemplate, teamAddress } from "@/lib/email";
import { logOutbound, type OutboundRow } from "@/lib/inbox/outbound";
import { SITE_URL } from "@/lib/site/site-url";
import { AnnouncementEmail } from "@/emails/templates";
import { emailHtml, htmlToText } from "@/lib/email-html";
import { loadEmailFiles } from "@/lib/email-attachments";
import {
  fileMode,
  formatBytes,
  type EmailFile,
  type FileMode,
} from "@/lib/email-files";
import {
  checkAnnouncement,
  fillTags,
  type AnnouncementInput,
  type RegStatus,
} from "@/lib/events/announcements";

type Fail = { success: false; message: string };

async function actor(): Promise<AdminActor | Fail> {
  try {
    return await requireAdmin("events");
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof AdminAuthError && error.status === 403
          ? "You don't have access to email attendees."
          : "Your session has ended. Sign in again.",
    };
  }
}
const failed = (v: unknown): v is Fail =>
  !!v && typeof v === "object" && "success" in v;

const STATUSES: RegStatus[] = ["ACCEPTED", "PENDING", "DECLINED"];

const EVENT_SELECT = {
  id: true,
  slug: true,
  title: true,
  dateTime: true,
  timezone: true,
  location: true,
} as const;

/** Who gets it, worked out on the server: one email per address. */
async function recipients(input: AnnouncementInput) {
  const statuses = input.statuses.filter((s) => STATUSES.includes(s));
  const rows = await prisma.eventRegistration.findMany({
    where: {
      status: { in: statuses },
      ...(input.eventId !== "all" ? { eventId: input.eventId } : {}),
    },
    orderBy: { createdAt: "asc" },
    include: { event: { select: EVENT_SELECT } },
  });
  const seen = new Set<string>();
  return rows.filter((r) => {
    const key = r.email.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

type Recipient = Awaited<ReturnType<typeof recipients>>[number];

function emailFor(
  input: AnnouncementInput,
  r: Pick<Recipient, "name" | "event">,
  files: EmailFile[] = [],
  mode: FileMode = "attach",
) {
  const details = eventDetails(r.event);
  const link = `${SITE_URL}/events/${r.event.slug}`;
  const first = r.name.trim().split(/\s+/)[0] ?? "";
  // The HTML is cleaned first; each person's details go in escaped.
  const html = emailHtml(input.body, {
    first_name: first,
    name: r.name,
    event: r.event.title,
    date: details.when,
    location: r.event.location,
    event_link: link,
  });
  return {
    subject: fillTags(input.subject.trim(), {
      name: r.name,
      event: r.event.title,
      date: details.when,
      location: r.event.location,
      eventLink: link,
    }),
    element: createElement(AnnouncementEmail, {
      html,
      preview: htmlToText(html).replace(/\s+/g, " ").slice(0, 120),
      event: input.includeEvent ? details : undefined,
      eventUrl: input.includeEvent ? link : undefined,
      files:
        mode === "link" && files.length
          ? files.map((f) => ({
              name: f.name,
              url: f.url,
              size: formatBytes(f.bytes),
            }))
          : undefined,
    }),
  };
}

/** For the preview when no one matches yet. */
const sample = (eventId: string) =>
  prisma.event
    .findFirst({
      where: eventId !== "all" ? { id: eventId } : undefined,
      orderBy: { dateTime: "desc" },
      select: EVENT_SELECT,
    })
    .then((event) => (event ? { name: "Ada Obi", event } : null));

async function filesFor(input: AnnouncementInput, people: number) {
  const files = await loadEmailFiles(input.fileIds ?? []);
  const { mode } = fileMode(input.fileMode ?? "attach", files, people);
  return {
    files,
    mode,
    attachments:
      mode === "attach" && files.length
        ? files.map((f) => ({ url: f.url, name: f.name }))
        : undefined,
  };
}

export async function previewAnnouncement(
  input: AnnouncementInput,
): Promise<{ success: true; html: string; subject: string } | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const list = await recipients(input);
  const first = list[0] ?? (await sample(input.eventId));
  if (!first) return { success: false, message: "There are no events yet." };
  const { files, mode } = await filesFor(input, list.length);
  const e = emailFor(
    {
      ...input,
      body: htmlToText(input.body)
        ? input.body
        : "<p>Your message appears here.</p>",
    },
    first,
    files,
    mode,
  );
  return { success: true, html: await render(e.element), subject: e.subject };
}

/** Sends it to you only, marked [Test], exactly as others will get it. */
export async function sendTest(
  input: AnnouncementInput,
): Promise<{ success: true; message: string } | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const problem = checkAnnouncement({ ...input, statuses: ["ACCEPTED"] });
  if (problem) return { success: false, message: problem };
  const list = await recipients(input);
  const first = list[0] ?? (await sample(input.eventId));
  if (!first) return { success: false, message: "There are no events yet." };
  const { files, mode, attachments } = await filesFor(input, list.length);
  const e = emailFor(input, { ...first, name: a.name }, files, mode);
  try {
    await sendTemplate({
      to: { email: a.email, name: a.name },
      subject: `[Test] ${e.subject}`,
      replyTo: teamAddress(),
      email: e.element,
      attachments,
    });
  } catch {
    return {
      success: false,
      message: "The test didn't send. Check the email settings.",
    };
  }
  return { success: true, message: `Test sent to ${a.email}` };
}

async function deliver(
  list: Recipient[],
  input: AnnouncementInput,
  batchId: string,
  a: AdminActor,
) {
  const rows: OutboundRow[] = [];
  const { files, mode, attachments } = await filesFor(input, list.length);
  const logged = files.map((f) => ({
    name: f.name,
    url: f.url,
    bytes: f.bytes,
    mode,
  }));
  // A few at a time: quick, without tripping the email service's limits.
  for (let i = 0; i < list.length; i += 4) {
    const chunk = list.slice(i, i + 4);
    const results = await Promise.all(
      chunk.map(async (r) => {
        const e = emailFor(input, r, files, mode);
        try {
          await sendTemplate({
            to: { email: r.email, name: r.name },
            subject: e.subject,
            replyTo: teamAddress(),
            email: e.element,
            attachments,
          });
          return { r, e, error: undefined as string | undefined };
        } catch (err) {
          return { r, e, error: (err as Error).message || "Refused" };
        }
      }),
    );
    for (const { r, e, error } of results)
      rows.push({
        kind: "BROADCAST",
        batchId,
        eventId: input.eventId === "all" ? null : input.eventId,
        toEmail: r.email,
        toName: r.name,
        subject: e.subject,
        body: input.body,
        status: error ? "FAILED" : "SENT",
        error,
        sentById: a.id,
        attachments: logged,
      });
  }
  return { rows, files, mode };
}

export async function sendAnnouncement(
  input: AnnouncementInput,
): Promise<
  { success: true; message: string; sent: number; failed: number } | Fail
> {
  const a = await actor();
  if (failed(a)) return a;
  const problem = checkAnnouncement(input);
  if (problem) return { success: false, message: problem };
  const list = await recipients(input);
  if (!list.length)
    return { success: false, message: "No one matches who to send it to." };

  const batchId = randomUUID();
  const { rows, files, mode } = await deliver(list, input, batchId, a);
  const sent = rows.filter((r) => r.status === "SENT").length;
  const failedCount = rows.length - sent;
  const logged = await logOutbound(rows);
  await logAudit({
    action: "events.announcement_sent",
    area: "events",
    summary: `Emailed ${sent} attendee${sent === 1 ? "" : "s"}: ${input.subject.trim()}${files.length ? ` with ${files.length} file${files.length === 1 ? "" : "s"} (${mode === "attach" ? "attached" : "as links"})` : ""}${failedCount ? ` (${failedCount} failed)` : ""}`,
    actor: a,
  });
  revalidatePath("/admin/messaging");
  if (!sent)
    return {
      success: false,
      message: "None of the emails sent. Check the email settings.",
    };
  return {
    success: true,
    sent,
    failed: failedCount,
    message:
      `Sent to ${sent} ${sent === 1 ? "person" : "people"}` +
      (failedCount
        ? `; ${failedCount} didn't send (you can retry them from the history)`
        : "") +
      (logged
        ? ""
        : ". It'll appear in the history once the database update is run."),
  };
}

type SavedFile = {
  name: string;
  url: string;
  bytes: number | null;
  mode: FileMode;
};

/** Tries the ones that didn't send again, with the same files. */
export async function resendFailed(
  batchId: string,
): Promise<{ success: true; message: string } | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const rows = await prisma.outboundEmail.findMany({
    where: { batchId, status: "FAILED", kind: "BROADCAST" },
  });
  if (!rows.length) return { success: true, message: "Nothing to retry." };
  let ok = 0;
  for (const row of rows) {
    const reg = await prisma.eventRegistration.findFirst({
      where: {
        email: { equals: row.toEmail, mode: "insensitive" },
        ...(row.eventId ? { eventId: row.eventId } : {}),
      },
      include: { event: { select: EVENT_SELECT } },
    });
    if (!reg) continue;
    const saved = Array.isArray(row.attachments)
      ? (row.attachments as SavedFile[])
      : [];
    const mode: FileMode = saved[0]?.mode ?? "attach";
    const files: EmailFile[] = saved.map((f, i) => ({
      id: String(i),
      name: f.name,
      url: f.url,
      bytes: f.bytes,
    }));
    const e = emailFor(
      {
        eventId: row.eventId ?? "all",
        statuses: STATUSES,
        subject: row.subject,
        body: row.body,
        includeEvent: true,
        fileIds: [],
        fileMode: mode,
      },
      reg,
      files,
      mode,
    );
    try {
      await sendTemplate({
        to: { email: row.toEmail, name: row.toName },
        subject: row.subject,
        replyTo: teamAddress(),
        email: e.element,
        attachments:
          mode === "attach" && files.length
            ? files.map((f) => ({ url: f.url, name: f.name }))
            : undefined,
      });
      await prisma.outboundEmail.update({
        where: { id: row.id },
        data: { status: "SENT", error: null },
      });
      ok++;
    } catch {
      // Still failing; left as it was.
    }
  }
  await logAudit({
    action: "events.announcement_retried",
    area: "events",
    summary: `Retried an announcement: ${ok} of ${rows.length} sent`,
    actor: a,
  });
  revalidatePath("/admin/messaging");
  return { success: true, message: `${ok} of ${rows.length} sent this time.` };
}
