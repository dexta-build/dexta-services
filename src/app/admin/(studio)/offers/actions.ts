"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/admin/audit";
import {
  AdminAuthError,
  requireAdmin,
  type AdminActor,
} from "@/lib/admin/session";
import { OFFERS_TAG } from "@/lib/offers-cache";

type Fail = {
  success: false;
  message: string;
  errors?: Record<string, string>;
};
type Ok<T = object> = { success: true } & T;

export type OfferForm = {
  name: string;
  description: string;
  features: string[];
  /** Whole naira; null = "Custom quote". */
  priceNGN: number | null;
  priceNote: string;
  badge: string;
  paymentLink: string;
  whatsappEnabled: boolean;
  /** ISO strings or null. */
  startsAt: string | null;
  endsAt: string | null;
  isHighlighted: boolean;
  isVisible: boolean;
};

async function actor(): Promise<AdminActor | Fail> {
  try {
    return await requireAdmin("offers");
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof AdminAuthError && error.status === 403
          ? "You don't have access to manage offers."
          : "Your session has ended. Sign in again.",
    };
  }
}
const failed = (v: unknown): v is Fail =>
  !!v && typeof v === "object" && "success" in v;

function refresh() {
  updateTag(OFFERS_TAG);
  revalidatePath("/admin/offers");
}

const httpUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => {
    if (!v) return true;
    try {
      const u = new URL(v);
      return u.protocol === "https:" || u.protocol === "http:";
    } catch {
      return false;
    }
  }, "Use a full address starting with https://");

const isoDate = z
  .string()
  .nullable()
  .refine((v) => v === null || !Number.isNaN(Date.parse(v)), "Pick a date");

const schema = z
  .object({
    name: z.string().trim().min(1, "Required").max(80),
    description: z.string().trim().min(1, "Required").max(400),
    features: z.array(z.string().trim().max(120)).max(16),
    priceNGN: z
      .number()
      .int("Whole naira only")
      .min(0, "Can't be negative")
      .max(10_000_000_000)
      .nullable(),
    priceNote: z.string().trim().max(40),
    badge: z.string().trim().max(30),
    paymentLink: httpUrl,
    whatsappEnabled: z.boolean(),
    startsAt: isoDate,
    endsAt: isoDate,
    isHighlighted: z.boolean(),
    isVisible: z.boolean(),
  })
  .refine(
    (d) =>
      !d.startsAt || !d.endsAt || Date.parse(d.endsAt) > Date.parse(d.startsAt),
    { path: ["endsAt"], message: "Must be after the start" },
  );

export async function saveOffer(
  id: string | null,
  input: OfferForm,
): Promise<Ok<{ id: string }> | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[i.path.join(".")] ??= i.message;
    return { success: false, message: "Some fields need attention.", errors };
  }
  const d = parsed.data;
  const data = {
    name: d.name,
    description: d.description,
    features: JSON.stringify(d.features.filter(Boolean)),
    priceNGN: d.priceNGN,
    priceNote: d.priceNote || null,
    badge: d.badge || null,
    paymentLink: d.paymentLink || null,
    whatsappEnabled: d.whatsappEnabled,
    startsAt: d.startsAt ? new Date(d.startsAt) : null,
    endsAt: d.endsAt ? new Date(d.endsAt) : null,
    isHighlighted: d.isHighlighted,
    isVisible: d.isVisible,
  };
  try {
    const row = id
      ? await prisma.offer.update({ where: { id }, data })
      : await prisma.offer.create({
          data: { ...data, position: await prisma.offer.count() },
        });
    await logAudit({
      action: id ? "offers.updated" : "offers.created",
      area: "offers",
      summary: `${id ? "Edited" : "Added"} the offer ${d.name}`,
      entityType: "Offer",
      entityId: row.id,
      actor: a,
    });
    refresh();
    return { success: true, id: row.id };
  } catch {
    return {
      success: false,
      message: "That couldn't be saved. Please try again.",
    };
  }
}

export async function setOfferFlags(
  id: string,
  flags: Partial<Record<"isVisible" | "isHighlighted", boolean>>,
): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const o = await prisma.offer.update({ where: { id }, data: flags });
  const [k, v] = Object.entries(flags)[0] ?? [];
  await logAudit({
    action: "offers.flags",
    area: "offers",
    summary: `${k === "isVisible" ? (v ? "Showed" : "Hid") : v ? "Highlighted" : "Unhighlighted"} the offer ${o.name}`,
    entityType: "Offer",
    entityId: id,
    actor: a,
  });
  refresh();
  return { success: true };
}

export async function reorderOffers(ids: string[]): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  await prisma.$transaction(
    ids.map((id, position) =>
      prisma.offer.update({ where: { id }, data: { position } }),
    ),
  );
  await logAudit({
    action: "offers.reordered",
    area: "offers",
    summary: "Reordered the offers",
    actor: a,
  });
  refresh();
  return { success: true };
}

/** Copies an offer (hidden, without dates) to start a new one from it. */
export async function duplicateOffer(id: string): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const o = await prisma.offer.findUnique({ where: { id } });
  if (!o) return { success: false, message: "That offer no longer exists." };
  const copy = await prisma.offer.create({
    data: {
      name: `${o.name} (copy)`.slice(0, 80),
      description: o.description,
      features: o.features,
      priceNGN: o.priceNGN,
      priceNote: o.priceNote,
      badge: o.badge,
      paymentLink: o.paymentLink,
      whatsappEnabled: o.whatsappEnabled,
      isHighlighted: false,
      isVisible: false,
      position: await prisma.offer.count(),
    },
  });
  await logAudit({
    action: "offers.duplicated",
    area: "offers",
    summary: `Copied the offer ${o.name}`,
    entityType: "Offer",
    entityId: copy.id,
    actor: a,
  });
  refresh();
  return { success: true };
}

export async function deleteOffer(id: string): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const o = await prisma.offer.findUnique({ where: { id } });
  if (!o) return { success: true };
  await prisma.offer.delete({ where: { id } });
  await logAudit({
    action: "offers.deleted",
    area: "offers",
    summary: `Deleted the offer ${o.name}`,
    entityType: "Offer",
    entityId: id,
    actor: a,
  });
  refresh();
  return { success: true };
}
