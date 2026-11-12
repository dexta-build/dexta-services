"use server";

import { eventPriceLabel } from "@/lib/events/price";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/admin/audit";
import {
  AdminAuthError,
  requireAdmin,
  type AdminActor,
} from "@/lib/admin/session";
import { slugify } from "@/lib/slugify";
import { EVENTS_TAG } from "@/lib/site/events-data";
import { RESERVED_KEYS } from "@/lib/events/fields";
import type { EventForm, EventStatusValue } from "@/lib/events/admin";
import {
  sendAcceptanceEmail,
  sendDeclineEmail,
  sendEventFullEmail,
} from "@/lib/email";

type Fail = {
  success: false;
  message: string;
  errors?: Record<string, string>;
};
type Ok<T = object> = { success: true; message?: string } & T;

async function actor(): Promise<AdminActor | Fail> {
  try {
    return await requireAdmin("events");
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof AdminAuthError && error.status === 403
          ? "You don't have access to manage events."
          : "Your session has ended. Sign in again.",
    };
  }
}
const failed = (v: unknown): v is Fail =>
  !!v && typeof v === "object" && "success" in v;

function refresh(id?: string) {
  updateTag(EVENTS_TAG);
  revalidatePath("/admin/events");
  revalidatePath("/admin/registrations");
  if (id) revalidatePath(`/admin/events/${id}`);
}

const fieldSchema = z.object({
  name: z
    .string()
    .regex(/^[a-z0-9_]{1,40}$/, "Use lower-case letters, numbers and _"),
  label: z.string().trim().min(1, "Give the question a label").max(120),
  type: z.enum(["TEXT", "EMAIL", "SELECT", "TEXTAREA", "URL", "CHECKBOX"]),
  placeholder: z.string().trim().max(200),
  required: z.boolean(),
  options: z.array(z.string().trim().min(1).max(100)).max(50),
});

const schema = z.object({
  title: z.string().trim().min(1, "Required").max(200),
  slug: z.string().trim().max(120),
  description: z.string().trim().min(1, "Required").max(5000),
  dateTime: z
    .string()
    .nullable()
    .refine((v) => !!v && !Number.isNaN(Date.parse(v)), "Pick a date and time"),
  timezone: z.string().min(1).max(60),
  location: z.string().trim().min(1, "Required").max(300),
  image: z.string().max(2000),
  attendeeLimit: z
    .number()
    .int()
    .min(1, "At least 1")
    .max(1_000_000)
    .nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]),
  isPaid: z.boolean(),
  priceNGN: z.number().int().min(0).max(1_000_000_000).nullable(),
  priceNote: z.string().trim().max(120),
  paymentLink: z
    .string()
    .trim()
    .max(1000)
    .refine(
      (v) => !v || /^https:\/\/[^\s]+\.[^\s]+/.test(v),
      "Use a full https:// link",
    ),
  fields: z.array(fieldSchema).max(30),
});

export async function saveEvent(
  id: string | null,
  input: EventForm,
): Promise<Ok<{ id: string; slug: string }> | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[i.path.join(".")] ??= i.message;
    return { success: false, message: "Some fields need attention.", errors };
  }
  const d = parsed.data;

  // Questions: unique keys, not the form's own, dropdowns with choices.
  const errors: Record<string, string> = {};
  const seen = new Set<string>();
  d.fields.forEach((f, i) => {
    if (RESERVED_KEYS.includes(f.name) || seen.has(f.name))
      errors[`fields.${i}.name`] = "Each question needs its own key";
    seen.add(f.name);
    if (f.type === "SELECT" && f.options.length === 0)
      errors[`fields.${i}.options`] = "Add at least one choice";
  });
  if (d.isPaid) {
    if (!d.priceNGN) errors.priceNGN = "Enter the price";
    if (!d.paymentLink) errors.paymentLink = "Add the payment link";
  }
  if (Object.keys(errors).length)
    return {
      success: false,
      message:
        errors.priceNGN || errors.paymentLink
          ? "A paid event needs its price and payment link."
          : "Check the registration form.",
      errors,
    };

  const slug = slugify(d.slug || d.title);
  if (!slug)
    return { success: false, message: "Give the event a page address." };
  const clash = await prisma.event.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (clash && clash.id !== id)
    return {
      success: false,
      message: `Another event already uses /events/${slug}.`,
      errors: { slug: "Already used" },
    };
  // An old address of another event still forwards there, so keep it.
  const oldClash = await prisma.eventSlugRedirect
    .findUnique({ where: { slug }, select: { eventId: true } })
    .catch(() => null);
  if (oldClash && oldClash.eventId !== id)
    return {
      success: false,
      message: `/events/${slug} used to belong to another event and still forwards there. Pick another address.`,
      errors: { slug: "Used before by another event" },
    };
  const previous = id
    ? await prisma.event.findUnique({ where: { id }, select: { slug: true } })
    : null;

  const data = {
    title: d.title,
    slug,
    description: d.description,
    dateTime: new Date(d.dateTime!),
    timezone: d.timezone,
    location: d.location,
    imagePublicId: d.image || null,
    attendeeLimit: d.attendeeLimit,
    status: d.status,
    isPaid: d.isPaid,
    priceNGN: d.isPaid ? d.priceNGN : null,
    priceNote: d.priceNote || null,
    paymentLink: d.isPaid ? d.paymentLink || null : null,
  };
  const fieldRows = d.fields.map((f, position) => ({
    name: f.name,
    label: f.label,
    type: f.type,
    placeholder: f.placeholder || null,
    required: f.required,
    options: f.type === "SELECT" ? JSON.stringify(f.options) : null,
    position,
  }));
  try {
    const row = await prisma.$transaction(async (tx) => {
      const event = id
        ? await tx.event.update({ where: { id }, data })
        : await tx.event.create({ data });
      // A new address: the old one keeps working and forwards here, and
      // this event's own old address can be taken back.
      if (previous && previous.slug !== slug)
        await tx.eventSlugRedirect.upsert({
          where: { slug: previous.slug },
          create: { slug: previous.slug, eventId: event.id },
          update: { eventId: event.id },
        });
      await tx.eventSlugRedirect.deleteMany({ where: { slug } });
      await tx.eventFormField.deleteMany({ where: { eventId: event.id } });
      if (fieldRows.length)
        await tx.eventFormField.createMany({
          data: fieldRows.map((f) => ({ ...f, eventId: event.id })),
        });
      return event;
    });
    await logAudit({
      action: id ? "events.updated" : "events.created",
      area: "events",
      summary: `${id ? "Edited" : "Added"} the event ${d.title}${previous && previous.slug !== slug ? ` (address /events/${previous.slug} → /events/${slug})` : ""}`,
      entityType: "Event",
      entityId: row.id,
      actor: a,
    });
    refresh(row.id);
    return { success: true, id: row.id, slug: row.slug };
  } catch {
    return {
      success: false,
      message: "That couldn't be saved. Please try again.",
    };
  }
}

export async function setEventsStatus(
  ids: string[],
  status: EventStatusValue,
): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  await prisma.event.updateMany({
    where: { id: { in: ids } },
    data: { status },
  });
  const word =
    status === "PUBLISHED"
      ? "Opened"
      : status === "CLOSED"
        ? "Closed registration for"
        : "Moved to drafts:";
  await logAudit({
    action: "events.status",
    area: "events",
    summary: `${word} ${ids.length} event${ids.length === 1 ? "" : "s"}`,
    actor: a,
  });
  refresh(ids.length === 1 ? ids[0] : undefined);
  return { success: true };
}

export async function duplicateEvent(
  id: string,
): Promise<Ok<{ id: string }> | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const e = await prisma.event.findUnique({
    where: { id },
    include: { formFields: true },
  });
  if (!e) return { success: false, message: "That event no longer exists." };
  let slug = `${e.slug}-copy`;
  for (let n = 2; await prisma.event.findUnique({ where: { slug } }); n++)
    slug = `${e.slug}-copy-${n}`;
  const copy = await prisma.event.create({
    data: {
      title: `${e.title} (copy)`.slice(0, 200),
      slug,
      description: e.description,
      dateTime: e.dateTime,
      timezone: e.timezone,
      location: e.location,
      imagePublicId: e.imagePublicId,
      attendeeLimit: e.attendeeLimit,
      status: "DRAFT",
      formFields: {
        create: e.formFields.map((f) => ({
          name: f.name,
          label: f.label,
          type: f.type,
          placeholder: f.placeholder,
          required: f.required,
          options: f.options,
          position: f.position,
        })),
      },
    },
  });
  await logAudit({
    action: "events.duplicated",
    area: "events",
    summary: `Copied the event ${e.title}`,
    entityType: "Event",
    entityId: copy.id,
    actor: a,
  });
  refresh();
  return { success: true, id: copy.id };
}

export async function deleteEvents(ids: string[]): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const { count } = await prisma.event.deleteMany({
    where: { id: { in: ids } },
  });
  await logAudit({
    action: "events.deleted",
    area: "events",
    summary: `Deleted ${count} event${count === 1 ? "" : "s"} and their registrations`,
    actor: a,
  });
  refresh();
  return { success: true };
}

/* ------------------------------------------------------------------ */
/* Registrations                                                       */
/* ------------------------------------------------------------------ */

const eventInfo = (e: {
  title: string;
  dateTime: Date;
  timezone: string;
  location: string;
  isPaid?: boolean;
  priceNGN?: number | null;
  paymentLink?: string | null;
}) => ({
  title: e.title,
  dateTime: e.dateTime,
  timezone: e.timezone,
  location: e.location,
  payment:
    e.isPaid && e.paymentLink
      ? {
          price: eventPriceLabel(true, e.priceNGN ?? null),
          link: e.paymentLink,
        }
      : undefined,
});

/**
 * Accepts pending registrations, oldest first, and emails each person.
 * When an event reaches its capacity, it closes and the rest of its
 * pending registrations are declined with a "fully booked" email.
 */
export async function acceptRegistrations(
  ids: string[],
): Promise<Ok<{ accepted: number }> | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const regs = await prisma.eventRegistration.findMany({
    where: { id: { in: ids }, status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: { event: true },
  });
  if (regs.length === 0)
    return {
      success: false,
      message: "Only pending registrations can be accepted.",
    };

  const accepted: typeof regs = [];
  const skipped: string[] = [];
  const full = new Map<string, (typeof regs)[number]["event"]>();
  const byEvent = new Map<string, typeof regs>();
  for (const r of regs)
    byEvent.set(r.eventId, [...(byEvent.get(r.eventId) ?? []), r]);

  const autoDeclined: {
    event: (typeof regs)[number]["event"];
    people: { name: string; email: string }[];
  }[] = [];

  for (const [eventId, list] of byEvent) {
    const event = list[0].event;
    if (event.status === "DRAFT") {
      skipped.push(...list.map((r) => r.id));
      continue;
    }
    await prisma.$transaction(async (tx) => {
      let count = await tx.eventRegistration.count({
        where: { eventId, status: "ACCEPTED" },
      });
      for (const r of list) {
        if (event.attendeeLimit && count >= event.attendeeLimit) {
          skipped.push(r.id);
          continue;
        }
        await tx.eventRegistration.update({
          where: { id: r.id },
          data: { status: "ACCEPTED", declineReason: null },
        });
        accepted.push(r);
        count++;
      }
      if (event.attendeeLimit && count >= event.attendeeLimit) {
        const rest = await tx.eventRegistration.findMany({
          where: { eventId, status: "PENDING" },
          select: { name: true, email: true },
        });
        if (rest.length) {
          await tx.eventRegistration.updateMany({
            where: { eventId, status: "PENDING" },
            data: {
              status: "DECLINED",
              declineReason: "Event capacity reached",
            },
          });
          autoDeclined.push({ event, people: rest });
        }
        await tx.event.update({
          where: { id: eventId },
          data: { status: "CLOSED" },
        });
        full.set(eventId, event);
      }
    });
  }

  let emailFailures = 0;
  for (const r of accepted) {
    try {
      await sendAcceptanceEmail(
        { name: r.name, email: r.email },
        eventInfo(r.event),
      );
    } catch (err) {
      emailFailures++;
      console.error(`[Accept] Email failed for ${r.email}`, err);
    }
  }
  for (const group of autoDeclined) {
    try {
      await sendEventFullEmail(group.people, eventInfo(group.event));
    } catch (err) {
      console.error("[Accept] Fully booked emails failed", err);
    }
  }

  await logAudit({
    action: "events.registrations_accepted",
    area: "events",
    summary: `Accepted ${accepted.length} registration${accepted.length === 1 ? "" : "s"}${full.size ? ` (${[...full.values()].map((e) => e.title).join(", ")} now full)` : ""}`,
    actor: a,
  });
  refresh();

  const parts = [`${accepted.length} accepted and emailed`];
  if (autoDeclined.length)
    parts.push(
      `${autoDeclined.reduce((n, g) => n + g.people.length, 0)} others declined because the event is now full`,
    );
  if (skipped.length)
    parts.push(`${skipped.length} not accepted (event full or still a draft)`);
  if (emailFailures)
    parts.push(
      `${emailFailures} email${emailFailures === 1 ? "" : "s"} failed to send`,
    );
  return {
    success: true,
    accepted: accepted.length,
    message: parts.join(" · "),
  };
}

export async function declineRegistrations(
  ids: string[],
  reason: string,
): Promise<Ok<{ declined: number }> | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const why = reason.trim().slice(0, 500);
  const regs = await prisma.eventRegistration.findMany({
    where: { id: { in: ids }, status: "PENDING" },
    include: { event: true },
  });
  if (regs.length === 0)
    return {
      success: false,
      message: "Only pending registrations can be declined.",
    };
  await prisma.eventRegistration.updateMany({
    where: { id: { in: regs.map((r) => r.id) } },
    data: { status: "DECLINED", declineReason: why || null },
  });
  let emailFailures = 0;
  for (const r of regs) {
    try {
      await sendDeclineEmail(
        { name: r.name, email: r.email },
        eventInfo(r.event),
        why || undefined,
      );
    } catch (err) {
      emailFailures++;
      console.error(`[Decline] Email failed for ${r.email}`, err);
    }
  }
  await logAudit({
    action: "events.registrations_declined",
    area: "events",
    summary: `Declined ${regs.length} registration${regs.length === 1 ? "" : "s"}`,
    actor: a,
  });
  refresh();
  return {
    success: true,
    declined: regs.length,
    message: `${regs.length} declined and emailed${emailFailures ? ` · ${emailFailures} email${emailFailures === 1 ? "" : "s"} failed to send` : ""}`,
  };
}

export async function deleteRegistrations(ids: string[]): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const { count } = await prisma.eventRegistration.deleteMany({
    where: { id: { in: ids } },
  });
  await logAudit({
    action: "events.registrations_deleted",
    area: "events",
    summary: `Deleted ${count} registration${count === 1 ? "" : "s"}`,
    actor: a,
  });
  refresh();
  return { success: true };
}

/** Stop an old address forwarding (it can then be used again). */
export async function removeEventRedirect(
  eventId: string,
  slug: string,
): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  try {
    await prisma.eventSlugRedirect.deleteMany({ where: { slug, eventId } });
  } catch {
    return { success: false, message: "That couldn't be removed." };
  }
  await logAudit({
    action: "events.redirect_removed",
    area: "events",
    summary: `Stopped /events/${slug} forwarding to its event`,
    entityType: "Event",
    entityId: eventId,
    actor: a,
  });
  refresh(eventId);
  return { success: true };
}
