"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/admin/audit";
import {
  AdminAuthError,
  requireAdmin,
  type AdminActor,
} from "@/lib/admin/session";
import { objectSchema } from "@/lib/content/fields";
import { resolvePageDef } from "@/lib/content/registry";
import { contentTag } from "@/lib/content/store";
import type { PageDef, SectionEnvelope } from "@/lib/content/define";

type Fail = {
  success: false;
  message: string;
  errors?: Record<string, string>;
};
type Ok<T = object> = { success: true } & T;

async function access(
  pageKey: string,
): Promise<{ def: PageDef; actor: AdminActor } | Fail> {
  const def = await resolvePageDef(pageKey);
  if (!def) return { success: false, message: "That page doesn't exist." };
  try {
    return { def, actor: await requireAdmin(def.area) };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof AdminAuthError && error.status === 403
          ? "You don't have access to edit this page."
          : "Your session has ended. Sign in again.",
    };
  }
}
const failed = (v: unknown): v is Fail =>
  !!v && typeof v === "object" && "success" in v;

function refresh(def: PageDef) {
  updateTag(contentTag(def.key));
  revalidatePath(`/admin/pages/${def.key}`);
  revalidatePath("/admin/pages");
}

/** Saves a section as a draft. Nothing changes on the site until it's published. */
export async function saveSectionDraft(
  pageKey: string,
  sectionKey: string,
  input: { data: unknown; hidden: boolean },
): Promise<Ok | Fail> {
  const a = await access(pageKey);
  if (failed(a)) return a;
  const sec = a.def.sections.find((s) => s.key === sectionKey);
  if (!sec) return { success: false, message: "That section doesn't exist." };

  const parsed = objectSchema(sec.fields).safeParse(input.data);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      errors[path] ??= issue.message.startsWith("Invalid")
        ? "Please check this field."
        : issue.message;
    }
    return { success: false, message: "Some fields need attention.", errors };
  }

  const draft: SectionEnvelope = {
    data: parsed.data,
    hidden: sec.canHide === false ? false : !!input.hidden,
  };
  await prisma.pageSection.upsert({
    where: { page_key: { page: a.def.key, key: sectionKey } },
    create: {
      page: a.def.key,
      key: sectionKey,
      draft: draft as Prisma.InputJsonValue,
      hasDraft: true,
      updatedBy: a.actor.name,
    },
    update: {
      draft: draft as Prisma.InputJsonValue,
      hasDraft: true,
      updatedBy: a.actor.name,
    },
  });
  await logAudit({
    action: "pages.save_draft",
    area: a.def.area,
    summary: `Saved a draft of ${a.def.label}: ${sec.label}`,
    entityType: "PageSection",
    entityId: `${a.def.key}/${sectionKey}`,
    actor: a.actor,
  });
  revalidatePath(`/admin/pages/${a.def.key}`);
  revalidatePath("/admin/pages");
  return { success: true };
}

/** Publishes the page's drafts (all, or just the given sections). */
export async function publishPage(
  pageKey: string,
  sectionKeys?: string[],
): Promise<Ok<{ count: number }> | Fail> {
  const a = await access(pageKey);
  if (failed(a)) return a;
  const rows = await prisma.pageSection.findMany({
    where: {
      page: a.def.key,
      hasDraft: true,
      ...(sectionKeys ? { key: { in: sectionKeys } } : {}),
    },
  });
  if (!rows.length) return { success: true, count: 0 };

  const now = new Date();
  await prisma.$transaction(
    rows.flatMap((r) => [
      prisma.pageSection.update({
        where: { id: r.id },
        data: {
          published: r.draft as Prisma.InputJsonValue,
          draft: Prisma.DbNull,
          hasDraft: false,
          publishedAt: now,
          publishedBy: a.actor.name,
        },
      }),
      prisma.pageSectionVersion.create({
        data: {
          page: a.def.key,
          key: r.key,
          content: r.draft as Prisma.InputJsonValue,
          publishedBy: a.actor.name,
        },
      }),
    ]),
  );
  const labels = rows.map(
    (r) => a.def.sections.find((s) => s.key === r.key)?.label ?? r.key,
  );
  await logAudit({
    action: "pages.publish",
    area: a.def.area,
    summary: `Published ${a.def.label}: ${labels.join(", ")}`,
    entityType: "Page",
    entityId: a.def.key,
    metadata: { sections: rows.map((r) => r.key) },
    actor: a.actor,
  });
  refresh(a.def);
  return { success: true, count: rows.length };
}

/** Throws away a section's draft, going back to what's published. */
export async function discardDraft(
  pageKey: string,
  sectionKey: string,
): Promise<Ok | Fail> {
  const a = await access(pageKey);
  if (failed(a)) return a;
  const row = await prisma.pageSection.findUnique({
    where: { page_key: { page: a.def.key, key: sectionKey } },
  });
  if (!row) return { success: true };
  if (!row.published)
    await prisma.pageSection.delete({ where: { id: row.id } });
  else
    await prisma.pageSection.update({
      where: { id: row.id },
      data: { draft: Prisma.DbNull, hasDraft: false },
    });
  const label =
    a.def.sections.find((s) => s.key === sectionKey)?.label ?? sectionKey;
  await logAudit({
    action: "pages.discard_draft",
    area: a.def.area,
    summary: `Discarded the draft of ${a.def.label}: ${label}`,
    entityType: "PageSection",
    entityId: `${a.def.key}/${sectionKey}`,
    actor: a.actor,
  });
  revalidatePath(`/admin/pages/${a.def.key}`);
  revalidatePath("/admin/pages");
  return { success: true };
}

export type VersionItem = {
  id: string;
  publishedBy: string | null;
  createdAt: string;
};

export async function listVersions(
  pageKey: string,
  sectionKey: string,
): Promise<Ok<{ versions: VersionItem[] }> | Fail> {
  const a = await access(pageKey);
  if (failed(a)) return a;
  const rows = await prisma.pageSectionVersion.findMany({
    where: { page: a.def.key, key: sectionKey },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, publishedBy: true, createdAt: true },
  });
  return {
    success: true,
    versions: rows.map((r) => ({
      id: r.id,
      publishedBy: r.publishedBy,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

/** Puts an earlier published version back as the draft (publish to make it live). */
export async function restoreVersion(
  pageKey: string,
  versionId: string,
): Promise<Ok | Fail> {
  const a = await access(pageKey);
  if (failed(a)) return a;
  const v = await prisma.pageSectionVersion.findUnique({
    where: { id: z.string().parse(versionId) },
  });
  if (!v || v.page !== a.def.key)
    return { success: false, message: "That version no longer exists." };
  await prisma.pageSection.upsert({
    where: { page_key: { page: v.page, key: v.key } },
    create: {
      page: v.page,
      key: v.key,
      draft: v.content as Prisma.InputJsonValue,
      hasDraft: true,
      updatedBy: a.actor.name,
    },
    update: {
      draft: v.content as Prisma.InputJsonValue,
      hasDraft: true,
      updatedBy: a.actor.name,
    },
  });
  const label = a.def.sections.find((s) => s.key === v.key)?.label ?? v.key;
  await logAudit({
    action: "pages.restore_version",
    area: a.def.area,
    summary: `Restored an earlier version of ${a.def.label}: ${label} (as a draft)`,
    entityType: "PageSection",
    entityId: `${v.page}/${v.key}`,
    metadata: { versionId },
    actor: a.actor,
  });
  revalidatePath(`/admin/pages/${a.def.key}`);
  return { success: true };
}
