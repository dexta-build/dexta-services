import prisma from "@/lib/prisma";
import { requirePageAccess } from "@/lib/admin/session";
import { loadPage } from "@/lib/content/store";
import { SITE_PAGE } from "@/lib/content/pages/site";
import { WORKS_PAGE } from "@/lib/content/pages/main";
import { getFullCatalog } from "@/lib/services/catalog";
import { HOME_SAMPLE_PROJECTS } from "@/lib/site/home-content";
import { PageHeader } from "@/components/admin/kit/layout";
import { Callout } from "@/components/admin/kit/display";
import { Button } from "@/components/site/button";
import { ProjectsManager, type ProjectRow } from "./projects-manager";

export const metadata = { title: "Projects" };

function parseTags(raw: string) {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v)
      ? v.filter((t): t is string => typeof t === "string")
      : [];
  } catch {
    return [];
  }
}

async function loadProjects(): Promise<{ rows: ProjectRow[]; ready: boolean }> {
  const base = {
    id: true,
    title: true,
    clientName: true,
    slug: true,
    description: true,
    serviceType: true,
    tags: true,
    websiteUrl: true,
    isFeatured: true,
    isVisible: true,
    position: true,
    mediaPublicId: true,
    assets: {
      orderBy: { position: "asc" as const },
      select: { publicId: true },
    },
  };
  const orderBy = [{ position: "asc" as const }, { createdAt: "asc" as const }];
  let ready = true;
  let rows;
  try {
    rows = await prisma.portfolioItem.findMany({
      orderBy,
      select: { ...base, service: true, occasion: true },
    });
  } catch {
    // service/occasion columns not pushed yet (or a stale dev server).
    ready = false;
    rows = (await prisma.portfolioItem.findMany({ orderBy, select: base })).map(
      (r) => ({
        ...r,
        service: null as string | null,
        occasion: null as string | null,
      }),
    );
  }
  return {
    ready,
    rows: rows.map((r) => ({
      id: r.id,
      title: r.title,
      clientName: r.clientName,
      slug: r.slug ?? "",
      description: r.description ?? "",
      serviceType: r.serviceType,
      service: r.service,
      occasion: r.occasion,
      tags: parseTags(r.tags),
      websiteUrl: r.websiteUrl,
      isFeatured: r.isFeatured,
      isVisible: r.isVisible,
      media: r.assets.length
        ? r.assets.map((x) => x.publicId)
        : r.mediaPublicId
          ? [r.mediaPublicId]
          : [],
    })),
  };
}

export default async function ProjectsPage() {
  await requirePageAccess("works");
  const [{ rows, ready }, catalog, site, works] = await Promise.all([
    loadProjects(),
    getFullCatalog(),
    loadPage(SITE_PAGE),
    loadPage(WORKS_PAGE),
  ]);
  const services = catalog.flatMap((p) =>
    p.services
      .filter((s) => !s.externalHref)
      .map((s) => ({
        value: `${p.key}/${s.slug}`,
        label: s.title,
        group: p.key.toUpperCase(),
      })),
  );
  const slugs = new Set(rows.map((r) => r.slug));
  const samplesLeft = HOME_SAMPLE_PROJECTS.filter(
    (p) => !slugs.has(p.slug),
  ).length;
  const showingSamples = works.data.projects.source !== "projects";

  return (
    <>
      <PageHeader
        eyebrow="Works"
        title="*Projects*"
        description="Each project has a gallery (the first image is the cover), a service and occasion for the filters, and can be featured on the Works page and homepage."
        actions={
          <Button href="/admin/pages/works" size="sm" variant="subtle" arrow>
            Works page
          </Button>
        }
      />
      {!ready && (
        <div className="mb-6">
          <Callout tone="warning" title="Finish setting up projects">
            Run the database update for this release (prisma db push) and
            restart the site. Until then projects can be viewed but not saved.
          </Callout>
        </div>
      )}
      {showingSamples && (
        <div className="mb-6">
          <Callout
            tone="info"
            title="The Works page is showing the sample projects"
            action={
              <Button href="/admin/pages/works" size="sm" variant="subtle">
                Change it
              </Button>
            }
          >
            Projects here appear on the site once the Works page&apos;s Projects
            gallery is set to “My projects”.
          </Callout>
        </div>
      )}
      <ProjectsManager
        projects={rows}
        services={services}
        occasions={site.data.taxonomy.occasions.filter(Boolean)}
        samplesLeft={samplesLeft}
      />
    </>
  );
}
