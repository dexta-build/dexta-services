import { requirePageAccess } from "@/lib/admin/session";
import {
  ensureCategoriesSeeded,
  readEditorOptions,
} from "@/lib/thoughts/admin";
import { SITE_URL } from "@/lib/site/site-url";
import { PostEditor } from "../post-editor";

export const metadata = { title: "New article" };

export default async function NewArticlePage() {
  await requirePageAccess("thoughts");
  await ensureCategoriesSeeded();
  const options = await readEditorOptions();
  return (
    <PostEditor
      post={null}
      categories={options.categories}
      authors={options.authors}
      tagSuggestions={options.tags}
      siteUrl={SITE_URL}
    />
  );
}
