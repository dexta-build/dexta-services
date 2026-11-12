import { notFound } from "next/navigation";
import { requirePageAccess } from "@/lib/admin/session";
import { PageHeader } from "@/components/admin/kit/layout";
import { Button } from "@/components/site/button";
import { getSchoolWebsiteProject } from "../../../actions";
import { SchoolWebsiteProjectEditor } from "./school-website-project-editor";

export const metadata = { title: "School website editor" };

export const dynamic = "force-dynamic";

export default async function SchoolWebsiteProjectEditorPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  await requirePageAccess("schools");
  const { projectId } = await params;

  const result = await getSchoolWebsiteProject(projectId);
  const project = result.project;

  if (!result.success || !project) {
    notFound();
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          {
            label: "Website projects",
            href: "/admin/we-brand-schools/projects",
          },
          { label: project.schoolName },
        ]}
        title={`${project.schoolName}'s *website*`}
        description="Edit the school's copy of its template page by page. Changes save as a draft; preview them, then export the files."
        actions={
          <Button
            href={`/admin/we-brand-schools/applications?open=${project.applicationId}`}
            size="sm"
            variant="subtle"
          >
            Their application
          </Button>
        }
      />
      <SchoolWebsiteProjectEditor
        projectId={project.id}
        applicationId={project.applicationId}
        projectStatus={project.status}
        content={project.contentJson}
        sourceSnapshot={project.sourceSnapshot}
        updatedAt={project.updatedAt.toISOString()}
        lastExportedAt={project.lastExportedAt?.toISOString() ?? null}
        exportZipUrl={project.exportZipUrl ?? null}
      />
    </>
  );
}
