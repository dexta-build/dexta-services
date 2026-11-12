import "server-only";
import prisma from "@/lib/prisma";
import type { InboxSourceKey } from "./inbox";
import { safeHtml } from "@/lib/email-html";

/**
 * The log of emails sent from the admin (OutboundEmail): inbox replies and
 * announcements, one row per recipient. Writing is best-effort so sending
 * never fails just because the log table isn't there yet.
 */

export type OutboundRow = {
  kind: "REPLY" | "BROADCAST";
  batchId?: string;
  source?: InboxSourceKey;
  itemId?: string;
  eventId?: string | null;
  toEmail: string;
  toName: string;
  subject: string;
  body: string;
  status: "SENT" | "FAILED";
  error?: string;
  sentById: string;
  attachments?: {
    name: string;
    url: string;
    bytes: number | null;
    mode: "attach" | "link";
  }[];
};

export async function logOutbound(rows: OutboundRow[]) {
  if (rows.length === 0) return true;
  const data = rows.map((r) => ({
    ...r,
    error: r.error?.slice(0, 500) ?? null,
    eventId: r.eventId ?? null,
    attachments: r.attachments?.length ? r.attachments : undefined,
  }));
  try {
    await prisma.outboundEmail.createMany({ data });
    return true;
  } catch {
    // Before the attachments column exists: log without it.
  }
  try {
    await prisma.outboundEmail.createMany({
      data: data.map(({ attachments: _a, ...rest }) => rest),
    });
    return true;
  } catch (error) {
    console.warn(
      "[outbound] couldn't log sent emails:",
      (error as Error).message,
    );
    return false;
  }
}

export type SentReply = {
  id: string;
  subject: string;
  /** Safe HTML of what was sent. */
  body: string;
  files: { name: string; url: string }[];
  sentAt: string;
  by: string;
  failed: boolean;
};

/** Replies sent per inbox item ("MESSAGE:12" → newest first). */
export async function readReplies(): Promise<Map<string, SentReply[]>> {
  const map = new Map<string, SentReply[]>();
  try {
    const rows = await prisma.outboundEmail.findMany({
      where: { kind: "REPLY" },
      orderBy: { createdAt: "desc" },
      include: { sentBy: { select: { name: true } } },
    });
    for (const r of rows) {
      const key = `${r.source}:${r.itemId}`;
      const list = map.get(key) ?? [];
      list.push({
        id: r.id,
        subject: r.subject,
        body: safeHtml(r.body),
        files: Array.isArray(r.attachments)
          ? (r.attachments as { name?: string; url?: string }[])
              .filter((f) => f?.url)
              .map((f) => ({ name: f.name ?? "File", url: f.url! }))
          : [],
        sentAt: r.createdAt.toISOString(),
        by: r.sentBy?.name ?? "Someone",
        failed: r.status === "FAILED",
      });
      map.set(key, list);
    }
  } catch {
    // Not in the database yet.
  }
  return map;
}
