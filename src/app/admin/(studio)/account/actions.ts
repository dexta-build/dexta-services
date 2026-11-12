"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/admin/audit";
import { passwordSchema } from "@/lib/admin/passwords";
import { requireAdmin } from "@/lib/admin/session";

type Result = { success: boolean; message?: string };

async function me() {
  try {
    return await requireAdmin(null);
  } catch {
    return null;
  }
}

export async function updateMyName(name: string): Promise<Result> {
  const actor = await me();
  if (!actor)
    return {
      success: false,
      message: "Your session has ended. Sign in again.",
    };
  const parsed = z
    .string()
    .trim()
    .min(2, "Enter your name.")
    .max(80)
    .safeParse(name);
  if (!parsed.success)
    return { success: false, message: parsed.error.issues[0]?.message };

  await prisma.adminUser.update({
    where: { id: actor.id },
    data: { name: parsed.data },
  });
  await logAudit({
    action: "account.name_changed",
    summary: `Changed their name to ${parsed.data}`,
    entityType: "AdminUser",
    entityId: actor.id,
    actor: { ...actor, name: parsed.data },
  });
  revalidatePath("/admin", "layout");
  return { success: true, message: "Name saved." };
}

/** Changes the password and signs out every session (including this one). */
export async function changeMyPassword(
  current: string,
  next: string,
): Promise<Result> {
  const actor = await me();
  if (!actor)
    return {
      success: false,
      message: "Your session has ended. Sign in again.",
    };
  const parsed = passwordSchema.safeParse(next);
  if (!parsed.success)
    return { success: false, message: parsed.error.issues[0]?.message };

  const user = await prisma.adminUser.findUnique({
    where: { id: actor.id },
    select: { password: true },
  });
  if (!user || !(await bcrypt.compare(current, user.password))) {
    return { success: false, message: "Your current password isn't right." };
  }
  if (await bcrypt.compare(parsed.data, user.password)) {
    return {
      success: false,
      message: "Choose a password you haven't used here.",
    };
  }

  await prisma.adminUser.update({
    where: { id: actor.id },
    data: {
      password: await bcrypt.hash(parsed.data, 12),
      sessionsValidFrom: new Date(),
    },
  });
  await logAudit({
    action: "account.password_changed",
    summary: "Changed their password",
    entityType: "AdminUser",
    entityId: actor.id,
    actor,
  });
  return { success: true };
}
