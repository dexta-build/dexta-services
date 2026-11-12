import "server-only";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin/session";
import type { AdminArea } from "@/lib/admin/permissions";

/**
 * Kept for existing callers. Prefer `requireAdmin(area, action)` from
 * "@/lib/admin/session", which also checks area access and logs changes.
 */
export async function requireAdminSession(
  area?: AdminArea | null,
  action?: string,
) {
  const adminUser = await requireAdmin(area, action);
  const session = await auth();
  return { session, adminUser };
}
