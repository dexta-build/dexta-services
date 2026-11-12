import "server-only";
import prisma from "@/lib/prisma";
import type { AdminRole } from "./permissions";

export type AdminUserRecord = {
  id: string;
  email: string;
  name: string;
  password: string;
  role: AdminRole;
  access: string[];
  isActive: boolean;
  lastLoginAt: Date | null;
  sessionsValidFrom: Date | null;
};

/**
 * Loads an admin user. If the role columns haven't been pushed to the
 * database yet, falls back to the original columns and treats the user as
 * an active Admin, so nobody is locked out during the upgrade.
 */
export async function findAdminUser(
  where: { email: string } | { id: string },
): Promise<AdminUserRecord | null> {
  try {
    const u = await prisma.adminUser.findUnique({ where });
    if (!u) return null;
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      password: u.password,
      role: u.role as AdminRole,
      access: u.access ?? [],
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt,
      sessionsValidFrom: u.sessionsValidFrom,
    };
  } catch {
    const u = await prisma.adminUser.findUnique({
      where,
      select: { id: true, email: true, name: true, password: true },
    });
    if (!u) return null;
    return {
      ...u,
      role: "ADMIN",
      access: [],
      isActive: true,
      lastLoginAt: null,
      sessionsValidFrom: null,
    };
  }
}

export async function touchLastLogin(id: string) {
  try {
    await prisma.adminUser.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  } catch {
    // Column not pushed yet: ignore.
  }
}

export function normaliseEmail(email: string) {
  return email.trim().toLowerCase();
}
