import { requirePageAccess } from "@/lib/admin/session";
import {
  ensureCategoriesSeeded,
  readEditorOptions,
  readPostsForAdmin,
} from "@/lib/thoughts/admin";
import { PageHeader } from "@/components/admin/kit/layout";
import { Callout } from "@/components/admin/kit/display";
import { Button } from "@/components/site/button";
import { PostsManager } from "./posts-manager";

export const metadata = { title: "Thoughts" };

export default async function ThoughtsAdminPage() {
  await requirePageAccess("thoughts");
  await ensureCategoriesSeeded();
  const [posts, options] = await Promise.all([
    readPostsForAdmin().catch(() => null),
    readEditorOptions().catch(() => ({
      categories: [],
      authors: [],
      tags: [],
    })),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Thoughts"
        title="Manage *articles*"
        description="Write, schedule and publish articles, with categories, authors, tags and search previews."
        actions={
          <>
            <Button
              href="/admin/thoughts/categories"
              size="sm"
              variant="subtle"
            >
              Categories
            </Button>
            <Button
              href="/admin/pages/thoughts"
              size="sm"
              variant="subtle"
              arrow
            >
              Thoughts page
            </Button>
          </>
        }
      />
      {posts ? (
        <PostsManager
          posts={posts}
          categories={options.categories}
          authors={options.authors}
        />
      ) : (
        <Callout tone="danger" title="Articles couldn't be loaded">
          The database didn&apos;t answer. Refresh the page to try again.
        </Callout>
      )}
    </>
  );
}
