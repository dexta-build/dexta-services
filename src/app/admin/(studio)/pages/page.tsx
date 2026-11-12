import Link from "next/link";
import { ArrowUpRight, FileText, Settings } from "lucide-react";
import { requirePageAccess } from "@/lib/admin/session";
import { canAccess } from "@/lib/admin/permissions";
import { listPages } from "@/lib/content/registry";
import { getPageSummaries } from "@/lib/content/admin";
import { timeAgo } from "@/lib/admin/format";
import {
  EmptyState,
  PageHeader,
  StatusPill,
} from "@/components/admin/kit/layout";
import type { PageGroup } from "@/lib/content/define";

export const metadata = { title: "Pages" };

const GROUPS: { key: PageGroup; title: string; description: string }[] = [
  {
    key: "Pages",
    title: "Pages",
    description: "The main pages of the website.",
  },
  {
    key: "Services",
    title: "Service pages",
    description: "Design, Build, Print and each service.",
  },
  {
    key: "Page templates",
    title: "Page templates",
    description:
      "Text shared by every project, event, article and catalogue page.",
  },
  {
    key: "Site-wide",
    title: "Site-wide",
    description: "Business details, menus, footer and search defaults.",
  },
];

export default async function PagesIndex() {
  const me = await requirePageAccess(null);
  const summaries = await getPageSummaries();
  const pages = (await listPages()).filter((p) => canAccess(me, p.area));

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Pages and *sections*"
        description="Edit any section of any page. Changes are saved as drafts; preview them on the real page, then publish."
      />
      {pages.length === 0 ? (
        <EmptyState
          icon={<FileText />}
          title="No pages to edit"
          description="Ask an Admin for access to a page area."
          className="bg-white"
        />
      ) : (
        <div className="flex flex-col gap-10">
          {GROUPS.map((g) => {
            const list = pages.filter((p) => p.group === g.key);
            if (!list.length) return null;
            return (
              <section key={g.key} aria-labelledby={`group-${g.key}`}>
                <div className="mb-3 flex flex-col gap-0.5">
                  <h2 id={`group-${g.key}`} className="text-lg font-bold">
                    {g.title}
                  </h2>
                  <p className="text-surface-muted text-sm">{g.description}</p>
                </div>
                <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {list.map((p) => {
                    const s = summaries[p.key];
                    return (
                      <li key={p.key}>
                        <Link
                          href={`/admin/pages/${p.key}`}
                          className="group flex h-full items-start gap-3 rounded-[12px] bg-white p-4 ring-1 ring-black/[0.06] transition-shadow hover:shadow-[0_18px_40px_-24px_rgb(0_8_107/0.45)]"
                        >
                          <span className="bg-ice text-royal inline-flex size-10 shrink-0 items-center justify-center rounded-full">
                            {p.path ? (
                              <FileText aria-hidden className="size-4" />
                            ) : (
                              <Settings aria-hidden className="size-4" />
                            )}
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="font-bold">{p.label}</span>
                              {s?.drafts ? (
                                <StatusPill tone="warning" dot>
                                  {s.drafts} draft{s.drafts === 1 ? "" : "s"}
                                </StatusPill>
                              ) : null}
                            </span>
                            <span className="text-surface-muted truncate text-xs">
                              {p.path ?? p.description} · {p.sections.length}{" "}
                              sections
                            </span>
                            {s?.lastPublishedAt && (
                              <span className="text-surface-muted text-xs">
                                Published {timeAgo(s.lastPublishedAt)}
                              </span>
                            )}
                          </span>
                          <ArrowUpRight
                            aria-hidden
                            className="text-surface-muted size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
