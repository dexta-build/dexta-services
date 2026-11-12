"use server";

import { revalidatePath, updateTag } from "next/cache";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/admin/audit";
import {
  AdminAuthError,
  requireAdmin,
  type AdminActor,
} from "@/lib/admin/session";
import { objectSchema } from "@/lib/content/fields";
import { CLIENT_FIELDS, type ClientForm } from "@/lib/site/client-fields";

type Fail = {
  success: false;
  message: string;
  errors?: Record<string, string>;
};
type Ok<T = object> = { success: true } & T;

async function actor(): Promise<AdminActor | Fail> {
  try {
    return await requireAdmin("works");
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof AdminAuthError && error.status === 403
          ? "You don't have access to manage clients."
          : "Your session has ended. Sign in again.",
    };
  }
}
const failed = (v: unknown): v is Fail =>
  !!v && typeof v === "object" && "success" in v;

function refresh() {
  updateTag("clients-content");
  revalidatePath("/admin/clients");
}

function cleanUrl(raw: string) {
  const v = raw.trim();
  if (!v) return null;
  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(withScheme);
    return u.protocol === "https:" || u.protocol === "http:"
      ? u.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

export async function saveClient(
  id: string | null,
  input: ClientForm,
): Promise<Ok<{ id: string }> | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const parsed = objectSchema(CLIENT_FIELDS).safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues)
      errors[i.path.join(".")] ??= i.message.startsWith("Invalid")
        ? "Please check this field."
        : i.message;
    return { success: false, message: "Some fields need attention.", errors };
  }
  const d = parsed.data as unknown as ClientForm;
  const name = d.name.trim();
  if (!name)
    return {
      success: false,
      message: "Give the client a name.",
      errors: { name: "Required" },
    };
  const websiteUrl = cleanUrl(d.websiteUrl ?? "");
  if (websiteUrl === undefined)
    return {
      success: false,
      message: "That website address doesn't look right.",
      errors: { websiteUrl: "Use an address like https://example.com" },
    };

  const data = {
    name,
    logoPublicId: d.logo || null,
    websiteUrl,
    isVisible: d.isVisible,
  };
  try {
    const row = id
      ? await prisma.client.update({ where: { id }, data })
      : await prisma.client.create({
          data: { ...data, position: await prisma.client.count() },
        });
    await logAudit({
      action: id ? "works.client_updated" : "works.client_created",
      area: "works",
      summary: `${id ? "Edited" : "Added"} the client ${name}`,
      entityType: "Client",
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

export async function setClientVisible(
  id: string,
  isVisible: boolean,
): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const c = await prisma.client.update({ where: { id }, data: { isVisible } });
  await logAudit({
    action: "works.client_visibility",
    area: "works",
    summary: `${isVisible ? "Showed" : "Hid"} the client ${c.name}`,
    entityType: "Client",
    entityId: id,
    actor: a,
  });
  refresh();
  return { success: true };
}

export async function reorderClients(ids: string[]): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  await prisma.$transaction(
    ids.map((id, i) =>
      prisma.client.update({ where: { id }, data: { position: i } }),
    ),
  );
  await logAudit({
    action: "works.clients_reordered",
    area: "works",
    summary: "Reordered client logos",
    actor: a,
  });
  refresh();
  return { success: true };
}

export async function deleteClients(ids: string[]): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const rows = await prisma.client.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
  if (rows.length === 0) return { success: true };
  await prisma.client.deleteMany({
    where: { id: { in: rows.map((r) => r.id) } },
  });
  await logAudit({
    action: "works.client_deleted",
    area: "works",
    summary:
      rows.length === 1
        ? `Deleted the client ${rows[0].name}`
        : `Deleted ${rows.length} clients`,
    entityType: "Client",
    entityId: rows.length === 1 ? rows[0].id : undefined,
    actor: a,
  });
  refresh();
  return { success: true };
}
