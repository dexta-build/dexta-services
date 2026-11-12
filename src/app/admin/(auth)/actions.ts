"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { verifyRecaptcha } from "@/lib/recaptcha";
import {
  formatRateLimitWaitTime,
  getClientIp,
  rateLimit,
  RATE_LIMITS,
} from "@/lib/rate-limit";
import {
  LOGIN_MAX_PER_EMAIL,
  LOGIN_MAX_PER_IP,
  LOGIN_WINDOW_MS,
} from "@/lib/auth";
import { logAudit, recentFailedLogins } from "@/lib/admin/audit";
import { sendResetEmail } from "@/lib/admin/emails";
import { passwordSchema } from "@/lib/admin/passwords";
import { createToken, hashToken, RESET_TTL_MS } from "@/lib/admin/tokens";
import { findAdminUser, normaliseEmail } from "@/lib/admin/users";

type Result = { success: boolean; message?: string };

async function checkRecaptcha(token: string | undefined, action: string) {
  if (!token) return true;
  const result = await verifyRecaptcha(token, action);
  return result.success;
}

/**
 * Before signIn("credentials"): reCAPTCHA, a quick per-IP limit, and the
 * database lockout (5 failed tries per email or 20 per IP in 15 minutes),
 * so a locked-out user sees why instead of "wrong password".
 */
export async function verifyLoginRequest(
  email: string,
  recaptchaToken?: string,
): Promise<Result> {
  const ip = getClientIp(await headers());
  const limit = rateLimit(`login:${ip}`, {
    ...RATE_LIMITS.login,
    max: LOGIN_MAX_PER_IP,
  });
  if (!limit.success) {
    return {
      success: false,
      message: `Too many sign-in attempts. Try again in ${formatRateLimitWaitTime(limit.resetMs)}.`,
    };
  }

  const failed = await recentFailedLogins(
    normaliseEmail(email),
    ip,
    LOGIN_WINDOW_MS,
  );
  if (
    failed.byEmail >= LOGIN_MAX_PER_EMAIL ||
    failed.byIp >= LOGIN_MAX_PER_IP
  ) {
    return {
      success: false,
      message:
        "Too many failed attempts, so sign-in is paused for 15 minutes. You can reset your password instead.",
    };
  }

  if (!(await checkRecaptcha(recaptchaToken, "login"))) {
    return {
      success: false,
      message: "We couldn't verify you're human. Please try again.",
    };
  }
  return { success: true };
}

/**
 * Emails a reset link. Always answers the same way, so it can't be used to
 * find out which emails have accounts.
 */
export async function requestPasswordReset(
  email: string,
  recaptchaToken?: string,
): Promise<Result> {
  const parsed = z.email().safeParse(email.trim());
  if (!parsed.success)
    return { success: false, message: "Enter a valid email address." };

  const ip = getClientIp(await headers());
  const limit = rateLimit(`reset:${ip}`, RATE_LIMITS.form);
  if (!limit.success) {
    return {
      success: false,
      message: `Too many requests. Try again in ${formatRateLimitWaitTime(limit.resetMs)}.`,
    };
  }
  if (!(await checkRecaptcha(recaptchaToken, "forgot_password"))) {
    return {
      success: false,
      message: "We couldn't verify you're human. Please try again.",
    };
  }

  const user = await findAdminUser({ email: normaliseEmail(parsed.data) });
  if (user?.isActive) {
    try {
      const { token, tokenHash } = createToken();
      await prisma.adminPasswordReset.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + RESET_TTL_MS),
        },
      });
      await sendResetEmail({ email: user.email, name: user.name, token });
      await logAudit({
        action: "auth.password_reset_requested",
        actor: { id: user.id, email: user.email, name: user.name },
      });
    } catch (error) {
      console.error(
        "[reset] could not create reset:",
        (error as Error).message,
      );
    }
  }
  return { success: true };
}

async function findValidReset(token: string) {
  try {
    const reset = await prisma.adminPasswordReset.findUnique({
      where: { tokenHash: hashToken(token) },
      include: {
        user: { select: { id: true, email: true, name: true, isActive: true } },
      },
    });
    if (
      !reset ||
      reset.usedAt ||
      reset.expiresAt < new Date() ||
      !reset.user.isActive
    )
      return null;
    return reset;
  } catch {
    return null;
  }
}

/** For the reset page: is this link still good, and whose is it? */
export async function checkResetToken(token: string) {
  const reset = await findValidReset(token);
  return reset ? { email: reset.user.email } : null;
}

export async function resetPassword(
  token: string,
  password: string,
): Promise<Result> {
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success)
    return { success: false, message: parsed.error.issues[0]?.message };

  const reset = await findValidReset(token);
  if (!reset) {
    return {
      success: false,
      message: "This link has expired or was already used. Ask for a new one.",
    };
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.adminUser.update({
      where: { id: reset.userId },
      // Signs out every existing session.
      data: {
        password: await bcrypt.hash(parsed.data, 12),
        sessionsValidFrom: now,
      },
    }),
    prisma.adminPasswordReset.updateMany({
      where: { userId: reset.userId, usedAt: null },
      data: { usedAt: now },
    }),
  ]);
  await logAudit({
    action: "auth.password_reset",
    actor: {
      id: reset.user.id,
      email: reset.user.email,
      name: reset.user.name,
    },
  });
  return { success: true };
}

async function findValidInvite(token: string) {
  try {
    const invite = await prisma.adminInvite.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    if (
      !invite ||
      invite.acceptedAt ||
      invite.revokedAt ||
      invite.expiresAt < new Date()
    )
      return null;
    return invite;
  } catch {
    return null;
  }
}

/** For the invite page. */
export async function checkInviteToken(token: string) {
  const invite = await findValidInvite(token);
  return invite
    ? { email: invite.email, name: invite.name ?? "", role: invite.role }
    : null;
}

const acceptSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80),
  password: passwordSchema,
});

export async function acceptInvite(
  token: string,
  input: { name: string; password: string },
): Promise<Result> {
  const parsed = acceptSchema.safeParse(input);
  if (!parsed.success)
    return { success: false, message: parsed.error.issues[0]?.message };

  const invite = await findValidInvite(token);
  if (!invite) {
    return {
      success: false,
      message:
        "This invite has expired or was already used. Ask for a new one.",
    };
  }
  if (await findAdminUser({ email: invite.email })) {
    return {
      success: false,
      message: "There's already an account for this email. Sign in instead.",
    };
  }

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.adminUser.create({
      data: {
        email: invite.email,
        name: parsed.data.name,
        password: await bcrypt.hash(parsed.data.password, 12),
        role: invite.role,
        access: invite.role === "ADMIN" ? [] : invite.access,
      },
    });
    await tx.adminInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
    return created;
  });
  await logAudit({
    action: "auth.invite_accepted",
    area: "users",
    entityType: "AdminUser",
    entityId: user.id,
    actor: { id: user.id, email: user.email, name: user.name },
  });
  return { success: true };
}
