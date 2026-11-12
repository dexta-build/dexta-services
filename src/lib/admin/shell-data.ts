import "server-only";
import { canUseInbox, inboxCounts } from "@/lib/inbox/inbox";
import type { ShellUser } from "@/components/admin/shell/admin-shell";
import { requirePageAccess } from "./session";

/** The signed-in user and badge counts for the admin shell. */
export async function getShellData(): Promise<{
  user: ShellUser;
  unreadMessages: number;
}> {
  const actor = await requirePageAccess(null);
  // Unread and not done across the inbox (messages, registrations,
  // applications) that this person can see.
  const unreadMessages = canUseInbox(actor)
    ? await inboxCounts(actor)
        .then((c) => c.total)
        .catch(() => 0)
    : 0;
  return {
    user: {
      name: actor.name,
      email: actor.email,
      role: actor.role,
      access: actor.access,
    },
    unreadMessages,
  };
}
