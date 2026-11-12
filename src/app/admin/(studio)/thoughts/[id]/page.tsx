import { notFound } from "next/navigation";
import { requirePageAccess } from "@/lib/admin/session";
import { readEditorOptions, readPostForEditor } from "@/lib/thoughts/admin";
import { SITE_URL } from "@/lib/site/site-url";
import { PostEditor } from "../post-editor";

export const metadata = { title: "Edit article" };

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageAccess("thoughts");
  const { id } = await params;
  const [post, options] = await Promise.all([
    readPostForEditor(id).catch(() => null),
    readEditorOptions(),
  ]);
  if (!post) notFound();
  return (
    <PostEditor
      key={post.id}
      post={post}
      categories={options.categories}
      authors={options.authors}
      tagSuggestions={options.tags}
      siteUrl={SITE_URL}
    />
  );
}
