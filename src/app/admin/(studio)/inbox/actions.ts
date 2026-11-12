"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/admin/audit";
import {
  AdminAuthError,
  requireAdmin,
  type AdminActor,
} from "@/lib/admin/session";
import { createElement } from "react";
import { render } from "@react-email/render";
import {
  inboxAccess,
  readInbox,
  type InboxItem,
  type InboxSourceKey,
} from "@/lib/inbox/inbox";
import { logOutbound } from "@/lib/inbox/outbound";
import { sendTemplate, teamAddress } from "@/lib/email";
import { AssignedEmail, ReplyEmail } from "@/emails/templates";
import { emailHtml, htmlToText } from "@/lib/email-html";
import { loadEmailFiles } from "@/lib/email-attachments";
import { fileMode, formatBytes, type FileMode } from "@/lib/email-files";
import { SITE_URL } from "@/lib/site/site-url";

type Fail = { success: false; message: string };
type Ok = { success: true; message?: string };

const SOURCES: InboxSourceKey[] = ["MESSAGE", "REGISTRATION", "APPLICATION"];

async function actor(): Promise<AdminActor | Fail> {
  try {
    return await requireAdmin(null);
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof AdminAuthError && error.status === 403
          ? "You don't have access to the inbox."
          : "Your session has ended. Sign in again.",
    };
  }
}
const failed = (v: unknown): v is Fail =>
  !!v && typeof v === "object" && "success" in v;

/** "MESSAGE:12" → parts, keeping only sources this person may see. */
function parse(keys: string[], a: AdminActor) {
  const access = inboxAccess(a);
  return keys
    .map((k) => {
      const i = k.indexOf(":");
      return {
        source: k.slice(0, i) as InboxSourceKey,
        itemId: k.slice(i + 1),
      };
    })
    .filter((k) => SOURCES.includes(k.source) && access[k.source] && k.itemId);
}

const NOT_READY =
  "The inbox needs its database update (prisma db push) before it can save this.";

async function upsertStates(
  items: { source: InboxSourceKey; itemId: string }[],
  data: {
    readAt?: Date | null;
    doneAt?: Date | null;
    assigneeId?: string | null;
  },
) {
  await prisma.$transaction(
    items.map((it) =>
      prisma.inboxItemState.upsert({
        where: { source_itemId: { source: it.source, itemId: it.itemId } },
        create: { source: it.source, itemId: it.itemId, ...data },
        update: data,
      }),
    ),
  );
}

/** Keeps the contact form's own read flag in step (older screens use it). */
async function syncMessages(
  items: { source: InboxSourceKey; itemId: string }[],
  read: boolean,
) {
  const ids = items
    .filter((i) => i.source === "MESSAGE")
    .map((i) => Number(i.itemId))
    .filter(Number.isFinite);
  if (ids.length)
    await prisma.contactMessage.updateMany({
      where: { id: { in: ids } },
      data: { isRead: read, readAt: read ? new Date() : null },
    });
}

export async function setRead(
  keys: string[],
  read: boolean,
): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const items = parse(keys, a);
  if (!items.length) return { success: true };
  try {
    await syncMessages(items, read);
    await upsertStates(items, { readAt: read ? new Date() : null });
  } catch {
    return { success: false, message: NOT_READY };
  }
  revalidatePath("/admin", "layout");
  return { success: true };
}

/** Opening an item marks it read (quietly; nothing to undo). */
export async function markOpened(key: string): Promise<Ok | Fail> {
  return setRead([key], true);
}

export async function setDone(
  keys: string[],
  done: boolean,
): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const items = parse(keys, a);
  if (!items.length) return { success: true };
  try {
    const now = new Date();
    await syncMessages(items, true);
    await upsertStates(
      items,
      done ? { doneAt: now, readAt: now } : { doneAt: null },
    );
  } catch {
    return { success: false, message: NOT_READY };
  }
  await logAudit({
    action: done ? "inbox.done" : "inbox.reopened",
    area: "inbox",
    summary: `${done ? "Marked" : "Reopened"} ${items.length} inbox item${items.length === 1 ? "" : "s"}${done ? " as done" : ""}`,
    actor: a,
  });
  revalidatePath("/admin", "layout");
  return { success: true };
}

const LABEL: Record<InboxSourceKey, string> = {
  MESSAGE: "message",
  REGISTRATION: "registration",
  APPLICATION: "school application",
};

/** Assigns items to someone (or no one) and emails them when it's not you. */
export async function assign(
  keys: string[],
  assigneeId: string | null,
): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const items = parse(keys, a);
  if (!items.length) return { success: true };
  const person = assigneeId
    ? await prisma.adminUser.findFirst({
        where: { id: assigneeId, isActive: true },
        select: { id: true, name: true, email: true },
      })
    : null;
  if (assigneeId && !person)
    return { success: false, message: "That person can't be assigned." };
  try {
    await upsertStates(items, { assigneeId: person?.id ?? null });
  } catch {
    return { success: false, message: NOT_READY };
  }
  await logAudit({
    action: "inbox.assigned",
    area: "inbox",
    summary: person
      ? `Assigned ${items.length} inbox item${items.length === 1 ? "" : "s"} to ${person.name}`
      : `Unassigned ${items.length} inbox item${items.length === 1 ? "" : "s"}`,
    actor: a,
  });

  let message: string | undefined;
  if (person && person.id !== a.id) {
    const what =
      items.length === 1
        ? `a ${LABEL[items[0].source]}`
        : `${items.length} inbox items`;
    try {
      await sendTemplate({
        to: { email: person.email, name: person.name },
        subject: `${a.name} assigned you ${what}`,
        email: createElement(AssignedEmail, {
          assigner: a.name,
          what,
          url: `${SITE_URL}/admin/inbox?assigned=me`,
        }),
      });
    } catch {
      message = `Assigned to ${person.name}, but the email to let them know didn't send.`;
    }
  }
  revalidatePath("/admin", "layout");
  return { success: true, message };
}

/* ------------------------------------------------------------------ */
/* Replies                                                             */
/* ------------------------------------------------------------------ */

export type ReplyInput = {
  subject: string;
  /** HTML from the email editor. */
  body: string;
  /** Quote their message under the reply (contact messages). */
  quote: boolean;
  markDone: boolean;
  /** Media library files to send with it. */
  fileIds: string[];
  fileMode: FileMode;
};

/** The item as the server sees it (never trust what the browser sends). */
async function findItem(key: string, a: AdminActor) {
  if (!parse([key], a).length) return null;
  const { items } = await readInbox(a);
  return items.find((i) => i.key === key) ?? null;
}

async function buildReply(item: InboxItem, input: ReplyInput) {
  const files = await loadEmailFiles(input.fileIds ?? []);
  const { mode } = fileMode(input.fileMode ?? "attach", files, 1);
  const quote =
    input.quote && item.original
      ? {
          label: `On ${new Date(item.receivedAt).toLocaleString("en-GB", {
            dateStyle: "medium",
            timeStyle: "short",
          })}, ${item.name} wrote:`,
          text: item.original,
        }
      : undefined;
  const element = createElement(ReplyEmail, {
    html: emailHtml(input.body),
    preview: htmlToText(input.body).replace(/\s+/g, " ").slice(0, 120),
    quote,
    files:
      mode === "link"
        ? files.map((f) => ({
            name: f.name,
            url: f.url,
            size: formatBytes(f.bytes),
          }))
        : undefined,
  });
  return { element, files, mode };
}

function checkReply(input: ReplyInput) {
  const subject = input.subject.trim();
  const text = htmlToText(input.body);
  if (!subject) return "Add a subject.";
  if (subject.length > 200) return "The subject is too long.";
  if (!text) return "Write your reply.";
  if (input.body.length > 100_000) return "The reply is too long.";
  return null;
}

/** The reply as it will arrive, for the preview. */
export async function previewReply(
  key: string,
  input: ReplyInput,
): Promise<{ success: true; html: string } | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const item = await findItem(key, a);
  if (!item) return { success: false, message: "That item no longer exists." };
  const { element } = await buildReply(item, input);
  return { success: true, html: await render(element) };
}

/**
 * Sends a reply from the site's email account, with any files attached
 * (or linked when they're too big). Replies to it go to the team's
 * address. It's logged on the item and marks it read (and done).
 */
export async function sendReply(
  key: string,
  input: ReplyInput,
): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const problem = checkReply(input);
  if (problem) return { success: false, message: problem };
  const item = await findItem(key, a);
  if (!item) return { success: false, message: "That item no longer exists." };
  if (!item.email)
    return { success: false, message: "There's no email address to reply to." };

  const subject = input.subject.trim();
  const { element, files, mode } = await buildReply(item, input);
  let error: string | undefined;
  try {
    await sendTemplate({
      to: { email: item.email, name: item.name },
      subject,
      replyTo: teamAddress(),
      email: element,
      attachments:
        mode === "attach"
          ? files.map((f) => ({ url: f.url, name: f.name }))
          : undefined,
    });
  } catch (e) {
    error = (e as Error).message || "The email service refused it.";
  }

  const logged = await logOutbound([
    {
      kind: "REPLY",
      source: item.source,
      itemId: item.id,
      toEmail: item.email,
      toName: item.name,
      subject,
      body: input.body,
      status: error ? "FAILED" : "SENT",
      error,
      sentById: a.id,
      attachments: files.map((f) => ({
        name: f.name,
        url: f.url,
        bytes: f.bytes,
        mode,
      })),
    },
  ]);
  if (error)
    return {
      success: false,
      message: "The reply didn't send. Check the email settings and try again.",
    };

  const parts = parse([key], a);
  try {
    const now = new Date();
    await syncMessages(parts, true);
    await upsertStates(
      parts,
      input.markDone ? { readAt: now, doneAt: now } : { readAt: now },
    );
  } catch {
    // State table not there yet; the email still went.
  }
  await logAudit({
    action: "inbox.replied",
    area: "inbox",
    summary: `Replied to ${item.name} (${item.email}): ${subject}${files.length ? ` with ${files.length} file${files.length === 1 ? "" : "s"}` : ""}`,
    actor: a,
  });
  revalidatePath("/admin", "layout");
  return {
    success: true,
    message: logged
      ? `Reply sent to ${item.email}`
      : `Reply sent to ${item.email}. It'll show here once the database update is run.`,
  };
}
