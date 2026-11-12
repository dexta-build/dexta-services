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
import { contentTag } from "@/lib/content/store";
import { servicePageKey } from "@/lib/content/pages/services";
import { SERVICES_TAG } from "@/lib/services/catalog";

type Fail = { success: false; message: string };
type Ok<T = object> = { success: true } & T;

async function actor(): Promise<AdminActor | Fail> {
  try {
    return await requireAdmin("services");
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof AdminAuthError && error.status === 403
          ? "You don't have access to manage services."
          : "Your session has ended. Sign in again.",
    };
  }
}
const failed = (v: unknown): v is Fail =>
  !!v && typeof v === "object" && "success" in v;

function refresh() {
  updateTag(SERVICES_TAG);
  revalidatePath("/admin/services");
  revalidatePath("/admin/pages");
}

/* ── Groups ─────────────────────────────────────────────────────────────── */

const pillarSchema = z.object({
  title: z.string().trim().min(1, "Give the group a name.").max(30),
  pillClass: z.string().max(80).nullable(),
});

export async function updatePillar(
  id: string,
  input: z.input<typeof pillarSchema>,
): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const parsed = pillarSchema.safeParse(input);
  if (!parsed.success)
    return { success: false, message: parsed.error.issues[0].message };
  const p = await prisma.servicePillar.update({
    where: { id },
    data: parsed.data,
  });
  await logAudit({
    action: "services.group_updated",
    area: "services",
    summary: `Edited the ${p.title} group`,
    entityType: "ServicePillar",
    entityId: id,
    actor: a,
  });
  refresh();
  return { success: true };
}

export async function setPillarVisible(
  id: string,
  isVisible: boolean,
): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const visibleCount = await prisma.servicePillar.count({
    where: { isVisible: true },
  });
  if (!isVisible && visibleCount <= 1)
    return { success: false, message: "At least one group must stay visible." };
  const p = await prisma.servicePillar.update({
    where: { id },
    data: { isVisible },
  });
  await logAudit({
    action: isVisible ? "services.group_shown" : "services.group_hidden",
    area: "services",
    summary: `${isVisible ? "Showed" : "Hid"} the ${p.title} group`,
    entityType: "ServicePillar",
    entityId: id,
    actor: a,
  });
  refresh();
  return { success: true };
}

export async function reorderPillars(ids: string[]): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  await prisma.$transaction(
    ids.map((id, i) =>
      prisma.servicePillar.update({ where: { id }, data: { position: i } }),
    ),
  );
  await logAudit({
    action: "services.groups_reordered",
    area: "services",
    summary: "Reordered the service groups",
    actor: a,
  });
  refresh();
  return { success: true };
}

/* ── Services ───────────────────────────────────────────────────────────── */

const serviceSchema = z.object({
  pillarId: z.string().min(1),
  title: z.string().trim().min(1, "Give the service a name.").max(60),
  slug: z
    .string()
    .trim()
    .min(1, "Give the page an address.")
    .max(80)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lower-case letters, numbers and dashes only.",
    ),
  shortName: z.string().trim().min(1, "Add a short name.").max(60),
  description: z.string().trim().max(120),
  icon: z.string().max(30),
  cardImage: z.string().max(2000),
  externalHref: z.string().trim().max(500).nullable(),
  isVisible: z.boolean(),
});

export type ServiceInput = z.input<typeof serviceSchema>;

/** Moves a page's content (and history) when its address changes. */
async function movePageContent(from: string, to: string) {
  if (from === to) return;
  await prisma.$transaction([
    prisma.pageSection.deleteMany({ where: { page: to } }),
    prisma.pageSection.updateMany({
      where: { page: from },
      data: { page: to },
    }),
    prisma.pageSectionVersion.updateMany({
      where: { page: from },
      data: { page: to },
    }),
  ]);
  updateTag(contentTag(from));
  updateTag(contentTag(to));
}

export async function createService(
  input: ServiceInput,
): Promise<Ok<{ id: string }> | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success)
    return { success: false, message: parsed.error.issues[0].message };
  const d = parsed.data;
  const pillar = await prisma.servicePillar.findUnique({
    where: { id: d.pillarId },
  });
  if (!pillar)
    return { success: false, message: "That group no longer exists." };
  if (
    await prisma.service.findUnique({
      where: { pillarId_slug: { pillarId: d.pillarId, slug: d.slug } },
    })
  ) {
    return {
      success: false,
      message: `${pillar.title} already has a service at /services/${pillar.key}/${d.slug}.`,
    };
  }
  const position = await prisma.service.count({
    where: { pillarId: d.pillarId },
  });
  const s = await prisma.service.create({
    data: { ...d, externalHref: d.externalHref || null, position },
  });
  await logAudit({
    action: "services.created",
    area: "services",
    summary: `Added the service ${d.title} (${pillar.title})`,
    entityType: "Service",
    entityId: s.id,
    actor: a,
  });
  refresh();
  return { success: true, id: s.id };
}

export async function updateService(
  id: string,
  input: ServiceInput,
): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success)
    return { success: false, message: parsed.error.issues[0].message };
  const d = parsed.data;
  const current = await prisma.service.findUnique({
    where: { id },
    include: { pillar: true },
  });
  if (!current)
    return { success: false, message: "That service no longer exists." };
  const pillar = await prisma.servicePillar.findUnique({
    where: { id: d.pillarId },
  });
  if (!pillar)
    return { success: false, message: "That group no longer exists." };
  const clash = await prisma.service.findUnique({
    where: { pillarId_slug: { pillarId: d.pillarId, slug: d.slug } },
  });
  if (clash && clash.id !== id) {
    return {
      success: false,
      message: `${pillar.title} already has a service at /services/${pillar.key}/${d.slug}.`,
    };
  }
  const moved = current.pillarId !== d.pillarId;
  await prisma.service.update({
    where: { id },
    data: {
      ...d,
      externalHref: d.externalHref || null,
      // Moving to another group puts it at the end of that group.
      ...(moved
        ? {
            position: await prisma.service.count({
              where: { pillarId: d.pillarId },
            }),
          }
        : {}),
    },
  });
  await movePageContent(
    servicePageKey(current.pillar.key, current.slug),
    servicePageKey(pillar.key, d.slug),
  );
  await logAudit({
    action: "services.updated",
    area: "services",
    summary: `Edited the service ${d.title}${moved ? ` (moved to ${pillar.title})` : ""}`,
    entityType: "Service",
    entityId: id,
    actor: a,
  });
  refresh();
  return { success: true };
}

export async function setServiceVisible(
  id: string,
  isVisible: boolean,
): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const s = await prisma.service.update({ where: { id }, data: { isVisible } });
  await logAudit({
    action: isVisible ? "services.shown" : "services.hidden",
    area: "services",
    summary: `${isVisible ? "Showed" : "Hid"} the service ${s.title}`,
    entityType: "Service",
    entityId: id,
    actor: a,
  });
  refresh();
  return { success: true };
}

export async function reorderServices(
  pillarId: string,
  ids: string[],
): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  await prisma.$transaction(
    ids.map((id, i) =>
      prisma.service.updateMany({
        where: { id, pillarId },
        data: { position: i },
      }),
    ),
  );
  const p = await prisma.servicePillar.findUnique({ where: { id: pillarId } });
  await logAudit({
    action: "services.reordered",
    area: "services",
    summary: `Reordered the ${p?.title ?? ""} services`,
    entityType: "ServicePillar",
    entityId: pillarId,
    actor: a,
  });
  refresh();
  return { success: true };
}

/** Deletes a service and its page content. Can't be undone. */
export async function deleteService(id: string): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const s = await prisma.service.findUnique({
    where: { id },
    include: { pillar: true },
  });
  if (!s) return { success: true };
  const key = servicePageKey(s.pillar.key, s.slug);
  await prisma.$transaction([
    prisma.service.delete({ where: { id } }),
    prisma.pageSection.deleteMany({ where: { page: key } }),
    prisma.pageSectionVersion.deleteMany({ where: { page: key } }),
  ]);
  await logAudit({
    action: "services.deleted",
    area: "services",
    summary: `Deleted the service ${s.title} (${s.pillar.title})`,
    entityType: "Service",
    entityId: id,
    actor: a,
  });
  refresh();
  updateTag(contentTag(key));
  return { success: true };
}
