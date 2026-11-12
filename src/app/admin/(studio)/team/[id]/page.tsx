import { notFound } from "next/navigation";
import { requirePageAccess } from "@/lib/admin/session";
import { readAddressBook, readMemberForEditor } from "@/lib/team/admin";
import { SITE_URL } from "@/lib/site/site-url";
import { MemberEditor } from "../member-editor";

export const metadata = { title: "Team profile" };

export default async function MemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageAccess("about");
  const { id } = await params;
  const [member, book] = await Promise.all([
    readMemberForEditor(id).catch(() => null),
    readAddressBook(id),
  ]);
  if (!member) notFound();
  return (
    <MemberEditor
      key={member.id}
      id={member.id}
      initial={member.form}
      book={book}
      host={SITE_URL.replace(/^https?:\/\//, "")}
    />
  );
}
