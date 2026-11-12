"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/admin/audit";
import {
  sendInviteEmail,
  sendResetEmail,
  adminOrigin,
} from "@/lib/admin/emails";
import {
  ALL_CONTENT_AREAS,
  ROLE_LABELS,
  type AdminRole,
} from "@/lib/admin/permissions";
import {
  AdminAuthError,
  requireOwner,
  type AdminActor,
} from "@/lib/admin/session";
import { createToken, INVITE_TTL_MS, RESET_TTL_MS } from "@/lib/admin/tokens";
import { normaliseEmail } from "@/lib/admin/users";

type Result = { success: boolean; message?: string; link?: string };

const roleSchema = z.enum(["ADMIN", "EDITOR"]);
const accessSchema = z
  .array(z.string())
  .transform((list) =>
    list.filter((a) => (ALL_CONTENT_AREAS as string[]).includes(a)),
  );

async function owner(): Promise<AdminActor | Result> {
  try {
    return await requireOwner();
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof AdminAuthError && error.status === 403
          ? "Only Admins can manage users."
          : "Your session has ended. Sign in again.",
    };
  }
}

function isResult(v: AdminActor | Result): v is Result {
  return "success" in v;
}

function done(message: string, link?: string): Result {
  revalidatePath("/admin/users");
  return { success: true, message, link };
}

const inviteSchema = z.object({
  email: z.email("Enter a valid email."),
  name: z.string().trim().max(80).optional(),
  role: roleSchema,
  access: accessSchema,
});

export async function inviteUser(
  input: z.input<typeof inviteSchema>,
): Promise<Result> {
  const actor = await owner();
  if (isResult(actor)) return actor;
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success)
    return { success: false, message: parsed.error.issues[0]?.message };
  const { name, role } = parsed.data;
  const email = normaliseEmail(parsed.data.email);
  const access = role === "ADMIN" ? [] : parsed.data.access;
  if (role === "EDITOR" && access.length === 0) {
    return {
      success: false,
      message: "Pick at least one area this Editor can manage.",
    };
  }

  const existing = await prisma.adminUser.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing)
    return {
      success: false,
      message: "Someone with this email already has an account.",
    };

  const { token, tokenHash } = createToken();
  const invite = await prisma.$transaction(async (tx) => {
    // One live invite per email.
    await tx.adminInvite.updateMany({
      where: { email, acceptedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return tx.adminInvite.create({
      data: {
        email,
        name: name || null,
        role,
        access,
        tokenHash,
        invitedById: actor.id,
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      },
    });
  });

  const sent = await sendInviteEmail({
    email,
    name,
    inviterName: actor.name,
    roleLabel: ROLE_LABELS[role],
    token,
  });
  await logAudit({
    action: "users.invite",
    area: "users",
    summary: `Invited ${email} as ${ROLE_LABELS[role]}`,
    entityType: "AdminInvite",
    entityId: invite.id,
    metadata: { role, access },
    actor,
  });
  const link = `${await adminOrigin()}/admin/invite/${token}`;
  return done(
    sent
      ? `Invite sent to ${email}.`
      : `Invite created, but the email couldn't be sent. Copy the link and send it yourself.`,
    link,
  );
}

export async function resendInvite(id: string): Promise<Result> {
  const actor = await owner();
  if (isResult(actor)) return actor;
  const invite = await prisma.adminInvite.findUnique({ where: { id } });
  if (!invite || invite.acceptedAt || invite.revokedAt) {
    return { success: false, message: "This invite is no longer pending." };
  }
  const { token, tokenHash } = createToken();
  await prisma.adminInvite.update({
    where: { id },
    data: { tokenHash, expiresAt: new Date(Date.now() + INVITE_TTL_MS) },
  });
  const sent = await sendInviteEmail({
    email: invite.email,
    name: invite.name,
    inviterName: actor.name,
    roleLabel: ROLE_LABELS[invite.role as AdminRole],
    token,
  });
  await logAudit({
    action: "users.invite_resent",
    area: "users",
    summary: `Resent the invite to ${invite.email}`,
    entityType: "AdminInvite",
    entityId: id,
    actor,
  });
  const link = `${await adminOrigin()}/admin/invite/${token}`;
  return done(
    sent
      ? `Invite resent to ${invite.email}.`
      : "New link made, but the email couldn't be sent.",
    link,
  );
}

export async function revokeInvite(id: string): Promise<Result> {
  const actor = await owner();
  if (isResult(actor)) return actor;
  const invite = await prisma.adminInvite.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
  await logAudit({
    action: "users.invite_revoked",
    area: "users",
    summary: `Cancelled the invite to ${invite.email}`,
    entityType: "AdminInvite",
    entityId: id,
    actor,
  });
  return done("Invite cancelled.");
}

async function activeAdminCount() {
  return prisma.adminUser.count({ where: { role: "ADMIN", isActive: true } });
}

const updateSchema = z.object({ role: roleSchema, access: accessSchema });

export async function updateUserAccess(
  id: string,
  input: z.input<typeof updateSchema>,
): Promise<Result> {
  const actor = await owner();
  if (isResult(actor)) return actor;
  if (id === actor.id) {
    return {
      success: false,
      message: "You can't change your own role. Ask another Admin.",
    };
  }
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success)
    return { success: false, message: parsed.error.issues[0]?.message };
  const { role } = parsed.data;
  const access = role === "ADMIN" ? [] : parsed.data.access;
  if (role === "EDITOR" && access.length === 0) {
    return {
      success: false,
      message: "Pick at least one area, or disable the account instead.",
    };
  }

  const user = await prisma.adminUser.findUnique({ where: { id } });
  if (!user) return { success: false, message: "That user no longer exists." };
  if (
    user.role === "ADMIN" &&
    role !== "ADMIN" &&
    user.isActive &&
    (await activeAdminCount()) <= 1
  ) {
    return {
      success: false,
      message: "There must always be at least one active Admin.",
    };
  }

  await prisma.adminUser.update({ where: { id }, data: { role, access } });
  await logAudit({
    action: "users.access_changed",
    area: "users",
    summary: `Set ${user.email} to ${ROLE_LABELS[role]}${role === "EDITOR" ? ` (${access.join(", ")})` : ""}`,
    entityType: "AdminUser",
    entityId: id,
    metadata: {
      from: { role: user.role, access: user.access },
      to: { role, access },
    },
    actor,
  });
  return done(`${user.name}'s access was updated.`);
}

export async function setUserActive(
  id: string,
  active: boolean,
): Promise<Result> {
  const actor = await owner();
  if (isResult(actor)) return actor;
  if (id === actor.id && !active) {
    return { success: false, message: "You can't disable your own account." };
  }
  const user = await prisma.adminUser.findUnique({ where: { id } });
  if (!user) return { success: false, message: "That user no longer exists." };
  if (
    !active &&
    user.role === "ADMIN" &&
    user.isActive &&
    (await activeAdminCount()) <= 1
  ) {
    return {
      success: false,
      message: "There must always be at least one active Admin.",
    };
  }

  await prisma.adminUser.update({
    where: { id },
    data: active
      ? { isActive: true }
      : { isActive: false, sessionsValidFrom: new Date() },
  });
  await logAudit({
    action: active ? "users.enabled" : "users.disabled",
    area: "users",
    summary: `${active ? "Enabled" : "Disabled"} ${user.email}`,
    entityType: "AdminUser",
    entityId: id,
    actor,
  });
  return done(
    active
      ? `${user.name} can sign in again.`
      : `${user.name} was signed out and can no longer sign in.`,
  );
}

export async function signOutUserEverywhere(id: string): Promise<Result> {
  const actor = await owner();
  if (isResult(actor)) return actor;
  const user = await prisma.adminUser.update({
    where: { id },
    data: { sessionsValidFrom: new Date() },
  });
  await logAudit({
    action: "users.signed_out",
    area: "users",
    summary: `Signed ${user.email} out everywhere`,
    entityType: "AdminUser",
    entityId: id,
    actor,
  });
  return done(`${user.name} was signed out on every device.`);
}

export async function sendUserPasswordReset(id: string): Promise<Result> {
  const actor = await owner();
  if (isResult(actor)) return actor;
  const user = await prisma.adminUser.findUnique({ where: { id } });
  if (!user || !user.isActive)
    return { success: false, message: "Enable this account first." };
  const { token, tokenHash } = createToken();
  await prisma.adminPasswordReset.create({
    data: {
      userId: id,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
    },
  });
  const sent = await sendResetEmail({
    email: user.email,
    name: user.name,
    token,
  });
  await logAudit({
    action: "users.reset_sent",
    area: "users",
    summary: `Sent a password reset to ${user.email}`,
    entityType: "AdminUser",
    entityId: id,
    actor,
  });
  const link = `${await adminOrigin()}/admin/reset-password/${token}`;
  return done(
    sent
      ? `Reset link sent to ${user.email}.`
      : "Reset link made, but the email couldn't be sent.",
    link,
  );
}
