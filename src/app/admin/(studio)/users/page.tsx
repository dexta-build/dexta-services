import prisma from "@/lib/prisma";
import { requirePageAccess } from "@/lib/admin/session";
import { PageHeader } from "@/components/admin/kit/layout";
import { UsersManager, type InviteRow, type UserRow } from "./users-manager";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  const me = await requirePageAccess("users");

  const [users, invites] = await Promise.all([
    prisma.adminUser.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        access: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    }),
    prisma.adminInvite.findMany({
      where: { acceptedAt: null, revokedAt: null },
      orderBy: { createdAt: "desc" },
      include: { invitedBy: { select: { name: true } } },
    }),
  ]);

  const userRows: UserRow[] = users.map((u) => ({
    ...u,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
  }));
  const inviteRows: InviteRow[] = invites.map((i) => ({
    id: i.id,
    email: i.email,
    name: i.name,
    role: i.role,
    access: i.access,
    invitedBy: i.invitedBy?.name ?? null,
    expiresAt: i.expiresAt.toISOString(),
    createdAt: i.createdAt.toISOString(),
  }));

  return (
    <>
      <PageHeader
        eyebrow="Team & security"
        title="Users and *access*"
        description="Invite people to help run the site. Admins can do everything; Editors can only manage and publish the areas you give them."
      />
      <UsersManager users={userRows} invites={inviteRows} meId={me.id} />
    </>
  );
}
