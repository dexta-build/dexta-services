import { renderAdminSchoolWebsiteProjectPreview } from "@/lib/school-website-project-preview-route";

export const dynamic = "force-dynamic";

export async function GET(
  request: globalThis.Request,
  { params }: { params: Promise<{ projectId: string; pageSlug: string }> },
) {
  const { projectId, pageSlug } = await params;
  const url = new URL(request.url);

  return renderAdminSchoolWebsiteProjectPreview({
    projectId,
    pageSlug,
    previewSearch: url.search,
  });
}
