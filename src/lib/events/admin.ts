import "server-only";
import prisma from "@/lib/prisma";
import { parseOptions, type FieldType, type FormFieldDef } from "./fields";

export type EventStatusValue = "DRAFT" | "PUBLISHED" | "CLOSED";

export type AdminEventRow = {
  id: string;
  title: string;
  slug: string;
  image: string;
  dateTime: string;
  timezone: string;
  location: string;
  status: EventStatusValue;
  attendeeLimit: number | null;
  pending: number;
  accepted: number;
  declined: number;
};

export type EventForm = {
  title: string;
  slug: string;
  description: string;
  /** ISO instant, or null while not set. */
  dateTime: string | null;
  timezone: string;
  location: string;
  image: string;
  attendeeLimit: number | null;
  status: EventStatusValue;
  fields: FormFieldDef[];
};

export type AdminRegistration = {
  id: string;
  eventId: string;
  eventTitle: string;
  name: string;
  email: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  declineReason: string;
  createdAt: string;
  /** Raw answers keyed by field name (ticks may be true/false). */
  answers: Record<string, unknown>;
};

export type EventFieldsMap = Record<string, { name: string; label: string }[]>;

async function counts(eventIds: string[]) {
  const rows = await prisma.eventRegistration.groupBy({
    by: ["eventId", "status"],
    where: { eventId: { in: eventIds } },
    _count: { _all: true },
  });
  return (id: string, status: "PENDING" | "ACCEPTED" | "DECLINED") =>
    rows.find((r) => r.eventId === id && r.status === status)?._count._all ?? 0;
}

export async function readEventsForAdmin(): Promise<AdminEventRow[]> {
  const events = await prisma.event.findMany({
    orderBy: { dateTime: "desc" },
  });
  const count = await counts(events.map((e) => e.id));
  return events.map((e) => ({
    id: e.id,
    title: e.title,
    slug: e.slug,
    image: e.imagePublicId ?? "",
    dateTime: e.dateTime.toISOString(),
    timezone: e.timezone,
    location: e.location,
    status: e.status,
    attendeeLimit: e.attendeeLimit,
    pending: count(e.id, "PENDING"),
    accepted: count(e.id, "ACCEPTED"),
    declined: count(e.id, "DECLINED"),
  }));
}

export async function readEventForEditor(id: string) {
  const e = await prisma.event.findUnique({
    where: { id },
    include: { formFields: { orderBy: { position: "asc" } } },
  });
  if (!e) return null;
  const count = await counts([e.id]);
  const form: EventForm = {
    title: e.title,
    slug: e.slug,
    description: e.description,
    dateTime: e.dateTime.toISOString(),
    timezone: e.timezone,
    location: e.location,
    image: e.imagePublicId ?? "",
    attendeeLimit: e.attendeeLimit,
    status: e.status,
    fields: e.formFields.map((f) => ({
      name: f.name,
      label: f.label,
      type: f.type as FieldType,
      placeholder: f.placeholder ?? "",
      required: f.required,
      options: parseOptions(f.options),
    })),
  };
  return {
    id: e.id,
    form,
    counts: {
      pending: count(e.id, "PENDING"),
      accepted: count(e.id, "ACCEPTED"),
      declined: count(e.id, "DECLINED"),
    },
  };
}

function parseAnswers(raw: string): Record<string, unknown> {
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

/** Registrations (one event, or all) with each event's questions. */
export async function readRegistrations(eventId?: string) {
  const [rows, events] = await Promise.all([
    prisma.eventRegistration.findMany({
      where: eventId ? { eventId } : undefined,
      orderBy: { createdAt: "desc" },
      include: { event: { select: { title: true } } },
    }),
    prisma.event.findMany({
      where: eventId ? { id: eventId } : undefined,
      orderBy: { dateTime: "desc" },
      select: {
        id: true,
        title: true,
        formFields: {
          orderBy: { position: "asc" },
          select: { name: true, label: true },
        },
      },
    }),
  ]);
  const registrations: AdminRegistration[] = rows.map((r) => ({
    id: r.id,
    eventId: r.eventId,
    eventTitle: r.event.title,
    name: r.name,
    email: r.email,
    status: r.status,
    declineReason: r.declineReason ?? "",
    createdAt: r.createdAt.toISOString(),
    answers: parseAnswers(r.formData),
  }));
  const fields: EventFieldsMap = Object.fromEntries(
    events.map((e) => [e.id, e.formFields]),
  );
  return {
    registrations,
    fields,
    events: events.map((e) => ({ id: e.id, name: e.title })),
  };
}
