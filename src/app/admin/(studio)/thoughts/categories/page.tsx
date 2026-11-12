import { requirePageAccess } from "@/lib/admin/session";
import {
  ensureCategoriesSeeded,
  readCategoriesForAdmin,
} from "@/lib/thoughts/admin";
import { PageHeader } from "@/components/admin/kit/layout";
import { Callout } from "@/components/admin/kit/display";
import { CategoriesManager } from "./categories-manager";

export const metadata = { title: "Article categories" };

export default async function ThoughtCategoriesPage() {
  await requirePageAccess("thoughts");
  await ensureCategoriesSeeded();
  const categories = await readCategoriesForAdmin().catch(() => null);
  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Thoughts", href: "/admin/thoughts" },
          { label: "Categories" },
        ]}
        title="Article *categories*"
        description="Each has its own page at /thoughts/category/…, in its colour. Drag to set the order of the category menu. Categories without published articles stay off the site."
      />
      {categories ? (
        <CategoriesManager categories={categories} />
      ) : (
        <Callout tone="danger" title="Categories couldn't be loaded">
          Refresh the page to try again.
        </Callout>
      )}
    </>
  );
}
