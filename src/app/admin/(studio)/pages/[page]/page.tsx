import { notFound } from "next/navigation";
import { requirePageAccess } from "@/lib/admin/session";
import { resolvePageDef } from "@/lib/content/registry";
import { getEditorSections } from "@/lib/content/admin";
import { PageHeader } from "@/components/admin/kit/layout";
import { Callout } from "@/components/admin/kit/display";
import { PageEditor } from "@/components/admin/content/page-editor";
import { Button } from "@/components/site/button";
import { canAccess, areaForPath } from "@/lib/admin/permissions";
import type { AdminActor } from "@/lib/admin/session";

type Shortcut = { label: string; href: string };

/** The records shown on each page, so editors can jump to them. */
function shortcutsFor(key: string): Shortcut[] {
  if (key === "services" || key.startsWith("service.")) {
    return [{ label: "Manage services", href: "/admin/services" }];
  }
  const map: Record<string, Shortcut[]> = {
    works: [
      { label: "Projects", href: "/admin/works" },
      { label: "Our Expressions", href: "/admin/expressions" },
      { label: "Clients", href: "/admin/clients" },
    ],
    expressions: [{ label: "Our Expressions", href: "/admin/expressions" }],
    offers: [{ label: "Manage offers", href: "/admin/offers" }],
    thoughts: [
      { label: "Articles", href: "/admin/thoughts" },
      { label: "Categories", href: "/admin/thoughts/categories" },
    ],
    "template.article": [{ label: "Articles", href: "/admin/thoughts" }],
    catalogue: [{ label: "Manage catalogues", href: "/admin/catalogues" }],
    "template.catalogue": [
      { label: "Manage catalogues", href: "/admin/catalogues" },
    ],
    events: [
      { label: "Manage events", href: "/admin/events" },
      { label: "Registrations", href: "/admin/registrations" },
    ],
    "template.event": [
      { label: "Manage events", href: "/admin/events" },
      { label: "Registrations", href: "/admin/registrations" },
    ],
    about: [{ label: "Team", href: "/admin/team" }],
    "template.team": [{ label: "Team", href: "/admin/team" }],
    contact: [
      { label: "Inbox", href: "/admin/inbox" },
      { label: "Business details", href: "/admin/pages/site" },
    ],
    "template.work": [{ label: "Projects", href: "/admin/works" }],
    "template.expression": [
      { label: "Our Expressions", href: "/admin/expressions" },
    ],
  };
  return map[key] ?? [];
}

function Shortcuts({ pageKey, me }: { pageKey: string; me: AdminActor }) {
  const links = shortcutsFor(pageKey).filter((l) =>
    canAccess(me, areaForPath(l.href.split("?")[0])),
  );
  if (!links.length) return null;
  return (
    <>
      {links.map((l) => (
        <Button key={l.href} href={l.href} size="sm" variant="subtle" arrow>
          {l.label}
        </Button>
      ))}
    </>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const def = await resolvePageDef((await params).page);
  return { title: def?.label ?? "Page" };
}

export default async function EditPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const def = await resolvePageDef((await params).page);
  if (!def) notFound();
  const me = await requirePageAccess(def.area);

  let sections;
  try {
    sections = await getEditorSections(def);
  } catch {
    return (
      <>
        <PageHeader
          title={def.label}
          breadcrumbs={[
            { label: "Pages", href: "/admin/pages" },
            { label: def.label },
          ]}
        />
        <Callout tone="warning" title="Page editing isn't set up yet">
          Run the database update for this release (prisma db push), then
          restart the site and refresh.
        </Callout>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={def.label}
        description={
          def.description ??
          (def.path ? `Sections of ${def.path}, top to bottom.` : undefined)
        }
        breadcrumbs={[
          { label: "Pages", href: "/admin/pages" },
          { label: def.label },
        ]}
        actions={<Shortcuts pageKey={def.key} me={me} />}
      />
      <PageEditor
        pageKey={def.key}
        pageLabel={def.label}
        previewPath={def.path}
        sections={sections}
      />
    </>
  );
}
