import { requirePageAccess } from "@/lib/admin/session";
import { PageHeader } from "@/components/admin/kit/layout";
import { Button } from "@/components/site/button";
import { getSchoolWebsiteProjectsAdmin } from "../actions";
import { ProjectsManager } from "./projects-manager";

export const metadata = { title: "School website projects" };

export const dynamic = "force-dynamic";

export default async function WeBrandSchoolsProjectsPage() {
  await requirePageAccess("schools");
  const projects = await getSchoolWebsiteProjectsAdmin();

  return (
    <>
      <PageHeader
        eyebrow="We Brand Schools"
        title="Website *projects*"
        description="Each school's copy of its template: edit it, preview it, and export the files to put it online."
        actions={
          <Button
            href="/admin/we-brand-schools/applications"
            size="sm"
            variant="subtle"
          >
            Applications
          </Button>
        }
      />
      <ProjectsManager projects={projects} />
    </>
  );
}
