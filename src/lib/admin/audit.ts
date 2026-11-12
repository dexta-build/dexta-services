import "server-only";
import { headers } from "next/headers";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getClientIp } from "@/lib/rate-limit";

export type AuditEntry = {
  action: string;
  area?: string | null;
  summary?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  actor?: { id?: string | null; email?: string | null; name?: string | null };
};

async function requestIp() {
  try {
    return getClientIp(await headers());
  } catch {
    return null;
  }
}

/**
 * Records an entry in the audit log. Never throws: logging must not block
 * the action itself (or break the admin before the table is pushed).
 */
export async function logAudit(entry: AuditEntry) {
  try {
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        area: entry.area ?? null,
        summary: entry.summary ?? null,
        entityType: entry.entityType ?? null,
        entityId: entry.entityId ?? null,
        metadata: entry.metadata,
        actorId: entry.actor?.id ?? null,
        actorEmail: entry.actor?.email ?? null,
        actorName: entry.actor?.name ?? null,
        ip: await requestIp(),
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[audit] could not write entry:", (error as Error).message);
    }
  }
}

/** Failed sign-ins for this email or IP in the window (for lockout). */
export async function recentFailedLogins(
  email: string,
  ip: string | null,
  windowMs: number,
) {
  const since = new Date(Date.now() - windowMs);
  try {
    const [byEmail, byIp] = await Promise.all([
      prisma.auditLog.count({
        where: {
          action: "auth.login_failed",
          actorEmail: email,
          createdAt: { gte: since },
        },
      }),
      ip
        ? prisma.auditLog.count({
            where: {
              action: "auth.login_failed",
              ip,
              createdAt: { gte: since },
            },
          })
        : Promise.resolve(0),
    ]);
    return { byEmail, byIp };
  } catch {
    return { byEmail: 0, byIp: 0 };
  }
}
