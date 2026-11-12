import "server-only";
import prisma from "@/lib/prisma";
import { liveAddress } from "./addresses";
import { formFromRow, type TeamForm } from "./fields";

export type AdminMember = { id: string; postCount: number; form: TeamForm };

export async function readTeamForAdmin(): Promise<AdminMember[]> {
  const rows = await prisma.aboutTeamMember.findMany({
    orderBy: { position: "asc" },
    include: { _count: { select: { posts: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    postCount: r._count.posts,
    form: formFromRow(r),
  }));
}

export async function readMemberForEditor(
  id: string,
): Promise<AdminMember | null> {
  const r = await prisma.aboutTeamMember.findUnique({
    where: { id },
    include: { _count: { select: { posts: true } } },
  });
  return r
    ? { id: r.id, postCount: r._count.posts, form: formFromRow(r) }
    : null;
}

export type AddressBook = {
  /** Other people's current addresses → their names. */
  taken: Record<string, string>;
  /** Other people's old addresses → their names (reusing one moves it). */
  oldOfOthers: Record<string, string>;
  /** This person's old addresses, which redirect to them. */
  ownOld: string[];
  /** False until the redirects table exists (database update pending). */
  redirectsReady: boolean;
};

export async function readAddressBook(
  memberId: string | null,
): Promise<AddressBook> {
  const people = await prisma.aboutTeamMember.findMany({
    select: { id: true, name: true, slug: true },
  });
  const taken = Object.fromEntries(
    people
      .filter((p) => p.id !== memberId)
      .map((p) => [liveAddress(p.slug, p.name), p.name]),
  );
  try {
    const redirects = await prisma.teamSlugRedirect.findMany({
      orderBy: { createdAt: "desc" },
      select: { slug: true, memberId: true },
    });
    const nameOf = new Map(people.map((p) => [p.id, p.name]));
    return {
      taken,
      oldOfOthers: Object.fromEntries(
        redirects
          .filter((r) => r.memberId !== memberId)
          .map((r) => [r.slug, nameOf.get(r.memberId) ?? "someone"]),
      ),
      ownOld: redirects
        .filter((r) => r.memberId === memberId)
        .map((r) => r.slug),
      redirectsReady: true,
    };
  } catch {
    return { taken, oldOfOthers: {}, ownOld: [], redirectsReady: false };
  }
}
