import { requirePageAccess } from "@/lib/admin/session";
import { PageHeader } from "@/components/admin/kit/layout";
import { Button } from "@/components/site/button";
import { getWeBrandSchoolsPageContent } from "../actions";
import { WeBrandSchoolsContentForm } from "./we-brand-schools-content-form";

export const metadata = { title: "We Brand Schools page" };

export const dynamic = "force-dynamic";

export default async function WeBrandSchoolsContentPage() {
  await requirePageAccess("schools");
  const content = await getWeBrandSchoolsPageContent();

  return (
    <>
      <PageHeader
        eyebrow="We Brand Schools"
        title="The *page*"
        description="The logo, hero, overview, process steps and template intro on the We Brand Schools page."
        actions={
          <Button
            href="/webrandschools"
            size="sm"
            variant="subtle"
            arrow
            external
          >
            View page
          </Button>
        }
      />
      <WeBrandSchoolsContentForm content={content} />
    </>
  );
}
