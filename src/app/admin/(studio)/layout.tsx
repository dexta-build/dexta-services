import { AdminShell } from "@/components/admin/shell/admin-shell";
import { getShellData } from "@/lib/admin/shell-data";

/** Rebuilt admin pages, in the new design. */
export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, unreadMessages } = await getShellData();
  return (
    <AdminShell user={user} unreadMessages={unreadMessages}>
      {children}
    </AdminShell>
  );
}
