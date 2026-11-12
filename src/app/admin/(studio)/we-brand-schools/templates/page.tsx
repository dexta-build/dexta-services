import { requirePageAccess } from "@/lib/admin/session";
import { PageHeader } from "@/components/admin/kit/layout";
import { getSchoolWebsiteTemplatesAdmin } from "../actions";
import { TemplatesManager } from "./templates-manager";

export const metadata = { title: "School templates" };

export const dynamic = "force-dynamic";

export default async function WeBrandSchoolsTemplatesPage() {
  await requirePageAccess("schools");
  const templates = await getSchoolWebsiteTemplatesAdmin();

  return (
    <>
      <PageHeader
        eyebrow="We Brand Schools"
        title="Website *templates*"
        description="The website designs schools choose from: screenshots and videos, highlights, the cover image and a live demo link."
      />
      <TemplatesManager templates={templates} />
    </>
  );
}
