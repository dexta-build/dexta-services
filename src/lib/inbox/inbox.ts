import "server-only";
import prisma from "@/lib/prisma";
import { canAccess, type AdminIdentity } from "@/lib/admin/permissions";
import { answerText } from "@/lib/events/fields";
import { readReplies, type SentReply } from "./outbound";

/**
 * One inbox for contact messages, event registrations and We Brand Schools
 * applications. Each source keeps its own table; the inbox's read, done and
 * assigned state lives in InboxItemState.
 */

export type InboxSourceKey = "MESSAGE" | "REGISTRATION" | "APPLICATION";

export type InboxItem = {
  /** "MESSAGE:12", "REGISTRATION:uuid"… */
  key: string;
  source: InboxSourceKey;
  id: string;
  name: string;
  email: string;
  /** For WhatsApp, when the person gave a number. */
  phone: string;
  /** One line: the event, the school, or the start of the message. */
  subject: string;
  preview: string;
  receivedAt: string;
  read: boolean;
  done: boolean;
  assigneeId: string;
  /** Pending / Accepted / In progress… for registrations and applications. */
  status: string;
  /** Where to act on it (accept a registration, open an application). */
  href: string | null;
  /** Everything they sent, as label/value pairs. */
  details: { label: string; value: string }[];
  /** Their own words, quoted under a reply (contact messages). */
  original: string;
  /** Replies sent from the admin, newest first. */
  replies: SentReply[];
};

export type InboxAccess = Record<InboxSourceKey, boolean>;

/** The inbox area sees everything; otherwise each source's own area. */
export function inboxAccess(user: AdminIdentity): InboxAccess {
  const all = canAccess(user, "inbox");
  return {
    MESSAGE: all || canAccess(user, "contact"),
    REGISTRATION: all || canAccess(user, "events"),
    APPLICATION: all || canAccess(user, "schools"),
  };
}

export const canUseInbox = (user: AdminIdentity) =>
  Object.values(inboxAccess(user)).some(Boolean);

const statusWord = (s: string) =>
  s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ");

const PHONE_KEY = /phone|whatsapp|mobile|tel/i;

async function states() {
  try {
    const rows = await prisma.inboxItemState.findMany();
    return {
      ready: true,
      map: new Map(rows.map((r) => [`${r.source}:${r.itemId}`, r])),
    };
  } catch {
    // The state table isn't in the database yet.
    return { ready: false, map: new Map() };
  }
}

export async function readInbox(user: AdminIdentity): Promise<{
  items: InboxItem[];
  stateReady: boolean;
}> {
  const access = inboxAccess(user);
  const [{ ready, map }, messages, registrations, applications, replies] =
    await Promise.all([
      states(),
      access.MESSAGE
        ? prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } })
        : [],
      access.REGISTRATION
        ? prisma.eventRegistration.findMany({
            orderBy: { createdAt: "desc" },
            include: {
              event: {
                select: {
                  id: true,
                  title: true,
                  formFields: {
                    orderBy: { position: "asc" },
                    select: { name: true, label: true },
                  },
                },
              },
            },
          })
        : [],
      access.APPLICATION
        ? prisma.schoolWebsiteApplication.findMany({
            orderBy: { createdAt: "desc" },
          })
        : [],
      readReplies(),
    ]);

  const items: InboxItem[] = [];
  const stateOf = (key: string) =>
    map.get(key) as
      | { readAt: Date | null; doneAt: Date | null; assigneeId: string | null }
      | undefined;

  for (const m of messages) {
    const key = `MESSAGE:${m.id}`;
    const st = stateOf(key);
    const text = m.message.trim();
    items.push({
      key,
      source: "MESSAGE",
      id: String(m.id),
      name: m.name,
      email: m.email,
      phone: "",
      subject: text.split(/\n/)[0].slice(0, 90),
      preview: text.slice(0, 200),
      receivedAt: m.createdAt.toISOString(),
      read: st ? !!st.readAt : m.isRead,
      done: !!st?.doneAt,
      assigneeId: st?.assigneeId ?? "",
      status: "",
      href: null,
      details: [{ label: "Message", value: text }],
      original: text,
      replies: replies.get(key) ?? [],
    });
  }

  for (const r of registrations) {
    const key = `REGISTRATION:${r.id}`;
    const st = stateOf(key);
    let answers: Record<string, unknown> = {};
    try {
      answers = JSON.parse(r.formData) ?? {};
    } catch {
      answers = {};
    }
    const labels = new Map(r.event.formFields.map((f) => [f.name, f.label]));
    const details = Object.entries(answers)
      .map(([k, v]) => ({
        label: labels.get(k) ?? k.replace(/_/g, " "),
        value: answerText(v),
      }))
      .filter((d) => d.value);
    const phone =
      Object.entries(answers).find(
        ([k, v]) =>
          (PHONE_KEY.test(k) || PHONE_KEY.test(labels.get(k) ?? "")) &&
          typeof v === "string" &&
          v.trim(),
      )?.[1] ?? "";
    items.push({
      key,
      source: "REGISTRATION",
      id: r.id,
      name: r.name,
      email: r.email,
      phone: String(phone),
      subject: r.event.title,
      preview: details
        .slice(0, 2)
        .map((d) => `${d.label}: ${d.value}`)
        .join(" · "),
      receivedAt: r.createdAt.toISOString(),
      read: st ? !!st.readAt : r.status !== "PENDING",
      done: !!st?.doneAt,
      assigneeId: st?.assigneeId ?? "",
      status: statusWord(r.status),
      href: `/admin/events/${r.event.id}?tab=registrations`,
      details: [
        { label: "Event", value: r.event.title },
        ...details,
        ...(r.declineReason
          ? [{ label: "Decline reason", value: r.declineReason }]
          : []),
      ],
      original: "",
      replies: replies.get(key) ?? [],
    });
  }

  for (const a of applications) {
    const key = `APPLICATION:${a.id}`;
    const st = stateOf(key);
    const domain =
      a.domainChoice === "HAS_DOMAIN"
        ? a.existingDomain
        : [a.preferredDomain1, a.preferredDomain2].filter(Boolean).join(", ");
    items.push({
      key,
      source: "APPLICATION",
      id: a.id,
      name: a.officialContactName || a.schoolName,
      email: a.officialContactEmail || a.officialEmail,
      phone: a.officialContactPhone || a.officialPhone,
      subject: `${a.schoolName} · ${a.selectedTemplateName}`,
      preview: a.aboutSchool.slice(0, 200),
      receivedAt: a.createdAt.toISOString(),
      read: st ? !!st.readAt : a.status !== "PENDING",
      done: !!st?.doneAt,
      assigneeId: st?.assigneeId ?? "",
      status: statusWord(a.status),
      href: `/admin/we-brand-schools/applications?open=${a.id}`,
      details: [
        { label: "School", value: a.schoolName },
        { label: "Template", value: a.selectedTemplateName },
        {
          label: "Contact person",
          value: [a.officialContactName, a.officialContactRole]
            .filter(Boolean)
            .join(", "),
        },
        { label: "School phone", value: a.officialPhone },
        { label: "School email", value: a.officialEmail },
        { label: "Address", value: a.officialAddress },
        { label: "Website", value: a.officialWebsiteUrl ?? "" },
        { label: "Domain", value: domain ?? "" },
        { label: "About the school", value: a.aboutSchool },
        { label: "Vision", value: a.vision },
        { label: "Mission", value: a.mission },
        { label: "Core values", value: a.coreValues },
        ...(a.referralNameSnapshot
          ? [{ label: "Referred by", value: a.referralNameSnapshot }]
          : []),
        ...(a.adminNotes ? [{ label: "Notes", value: a.adminNotes }] : []),
      ].filter((d) => d.value),
      original: "",
      replies: replies.get(key) ?? [],
    });
  }

  items.sort((x, y) => y.receivedAt.localeCompare(x.receivedAt));
  return { items, stateReady: ready };
}

/** Unread, not-done counts per source, for the menu badge and dashboard. */
export async function inboxCounts(user: AdminIdentity) {
  const { items } = await readInbox(user);
  const open = items.filter((i) => !i.read && !i.done);
  return {
    total: open.length,
    MESSAGE: open.filter((i) => i.source === "MESSAGE").length,
    REGISTRATION: open.filter((i) => i.source === "REGISTRATION").length,
    APPLICATION: open.filter((i) => i.source === "APPLICATION").length,
  };
}

export async function readAssignees() {
  return prisma.adminUser.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });
}
