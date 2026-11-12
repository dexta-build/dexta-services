import { requirePageAccess } from "@/lib/admin/session";
import { PageHeader } from "@/components/admin/kit/layout";
import { Button } from "@/components/site/button";
import { getSchoolWebsiteApplicationsAdmin } from "../actions";
import { ApplicationsManager } from "./applications-manager";

export const metadata = { title: "School applications" };

export const dynamic = "force-dynamic";

export default async function WeBrandSchoolsApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string }>;
}) {
  await requirePageAccess("schools");
  const [applications, { open }] = await Promise.all([
    getSchoolWebsiteApplicationsAdmin(),
    searchParams,
  ]);

  return (
    <>
      <PageHeader
        eyebrow="We Brand Schools"
        title="School *applications*"
        description="Schools asking for a free website. Read what they sent, start their site, and take it live."
        actions={
          <Button
            href="/admin/we-brand-schools/projects"
            size="sm"
            variant="subtle"
          >
            Website projects
          </Button>
        }
      />
      <ApplicationsManager applications={applications} openId={open} />
    </>
  );
}
