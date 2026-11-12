import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { logAudit } from "./audit";
import { canAccess, type AdminArea, type AdminRole } from "./permissions";
import { findAdminUser } from "./users";

export type AdminActor = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  access: string[];
};

export class AdminAuthError extends Error {
  constructor(
    message: "Unauthorized" | "Forbidden",
    readonly status: 401 | 403 = message === "Unauthorized" ? 401 : 403,
  ) {
    super(message);
  }
}

/** Read-style action names that shouldn't fill the audit log. */
const READ_ACTION =
  /^(get|list|fetch|load|read|search|count|preview|check|has|is)[A-Z]/;

/**
 * The single check for admin server actions and API routes:
 * signed in, still active, session not revoked, and allowed in the area.
 * When `action` names a change (not a read), it's written to the audit log.
 *
 *   await requireAdmin("about", "updateHero");
 */
export async function requireAdmin(
  area?: AdminArea | null,
  action?: string,
  summary?: string,
): Promise<AdminActor> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) throw new AdminAuthError("Unauthorized");

  const user = await findAdminUser({ email });
  if (!user || !user.isActive) throw new AdminAuthError("Unauthorized");
  if (
    user.sessionsValidFrom &&
    user.sessionsValidFrom.getTime() > (session.user.issuedAt || 0)
  ) {
    throw new AdminAuthError("Unauthorized");
  }

  const actor: AdminActor = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    access: user.access,
  };
  if (!canAccess(actor, area)) throw new AdminAuthError("Forbidden");

  if (action && !READ_ACTION.test(action)) {
    await logAudit({
      action: area ? `${area}.${action}` : action,
      area: area ?? null,
      summary,
      actor,
    });
  }
  return actor;
}

/** Only Admins (the owner role). */
export async function requireOwner(action?: string, summary?: string) {
  const actor = await requireAdmin("users", action, summary);
  if (actor.role !== "ADMIN") throw new AdminAuthError("Forbidden");
  return actor;
}

/**
 * For admin pages (server components): redirects instead of throwing.
 * Not signed in → login; not allowed → dashboard with a notice.
 */
export async function requirePageAccess(area?: AdminArea | null) {
  try {
    return await requireAdmin(area);
  } catch (error) {
    if (error instanceof AdminAuthError && error.status === 403) {
      redirect(`/admin?denied=${area ?? ""}`);
    }
    redirect("/admin/login");
  }
}
