import { requirePageAccess } from "@/lib/admin/session";
import { readAddressBook } from "@/lib/team/admin";
import { SITE_URL } from "@/lib/site/site-url";
import { MemberEditor } from "../member-editor";

export const metadata = { title: "Add a person" };

export default async function NewMemberPage() {
  await requirePageAccess("about");
  const book = await readAddressBook(null);
  return (
    <MemberEditor
      id={null}
      initial={null}
      book={book}
      host={SITE_URL.replace(/^https?:\/\//, "")}
    />
  );
}
