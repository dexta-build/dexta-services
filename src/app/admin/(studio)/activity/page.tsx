import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { ChevronLeft, ChevronRight, History } from "lucide-react";
import prisma from "@/lib/prisma";
import { requirePageAccess } from "@/lib/admin/session";
import { CONTENT_AREAS } from "@/lib/admin/permissions";
import { describeAction, formatDate, timeAgo } from "@/lib/admin/format";
import {
  AdminCard,
  EmptyState,
  PageHeader,
  StatusPill,
} from "@/components/admin/kit/layout";
import { Button } from "@/components/site/button";

export const metadata = { title: "Activity" };

const PAGE_SIZE = 40;

const AREA_OPTIONS = [
  ...CONTENT_AREAS.map((a) => ({ value: a.key, label: a.label })),
  { value: "users", label: "Users" },
  { value: "settings", label: "Settings" },
];
const AREA_LABEL: Record<string, string> = Object.fromEntries(
  AREA_OPTIONS.map((o) => [o.value, o.label]),
);

const KIND_OPTIONS = [
  { value: "changes", label: "Content changes" },
  { value: "signins", label: "Sign-ins" },
  { value: "security", label: "Failed and blocked sign-ins" },
];

type Search = {
  q?: string;
  area?: string;
  kind?: string;
  actor?: string;
  page?: string;
};

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePageAccess("activity");
  const raw = await searchParams;
  const s: Search = {
    q: one(raw.q)?.trim() || undefined,
    area: one(raw.area) || undefined,
    kind: one(raw.kind) || undefined,
    actor: one(raw.actor) || undefined,
    page: one(raw.page),
  };
  const page = Math.max(1, Number(s.page) || 1);

  const where: Prisma.AuditLogWhereInput = { AND: [] };
  const and = where.AND as Prisma.AuditLogWhereInput[];
  if (s.area) and.push({ area: s.area });
  if (s.actor) and.push({ actorEmail: s.actor });
  if (s.kind === "signins") and.push({ action: "auth.login" });
  else if (s.kind === "security")
    and.push({ action: { in: ["auth.login_failed", "auth.login_blocked"] } });
  else if (s.kind === "changes")
    and.push({ NOT: { action: { startsWith: "auth." } } });
  if (s.q) {
    and.push({
      OR: [
        { summary: { contains: s.q, mode: "insensitive" } },
        { action: { contains: s.q, mode: "insensitive" } },
        { actorName: { contains: s.q, mode: "insensitive" } },
        { actorEmail: { contains: s.q, mode: "insensitive" } },
      ],
    });
  }

  let entries: Awaited<ReturnType<typeof prisma.auditLog.findMany>> = [];
  let total = 0;
  let actors: { actorEmail: string | null; actorName: string | null }[] = [];
  let unavailable = false;
  try {
    [entries, total, actors] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where: { actorEmail: { not: null } },
        distinct: ["actorEmail"],
        select: { actorEmail: true, actorName: true },
        orderBy: { actorEmail: "asc" },
        take: 100,
      }),
    ]);
  } catch {
    unavailable = true;
  }

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hrefFor = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(s)) if (v && k !== "page") q.set(k, v);
    if (p > 1) q.set("page", String(p));
    const str = q.toString();
    return str ? `/admin/activity?${str}` : "/admin/activity";
  };
  const filtered = !!(s.q || s.area || s.kind || s.actor);
  const select =
    "h-10 cursor-pointer rounded-full border border-charcoal/[0.14] bg-white px-4 text-sm font-bold outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgb(0_171_255/0.2)]";

  return (
    <>
      <PageHeader
        eyebrow="Team & security"
        title="Activity *log*"
        description="Every change made in the admin and every sign-in, newest first. Entries can't be edited or deleted."
      />

      <form
        method="get"
        role="search"
        aria-label="Filter activity"
        className="mb-5 flex flex-wrap items-center gap-2"
      >
        <label className="w-full md:w-72">
          <span className="sr-only">Search</span>
          <input
            type="search"
            name="q"
            defaultValue={s.q}
            placeholder="Search activity"
            className="h-10 w-full rounded-full border border-charcoal/[0.14] bg-white px-4 text-sm outline-none placeholder:text-[#737773] focus:border-brand focus:shadow-[0_0_0_3px_rgb(0_171_255/0.2)]"
          />
        </label>
        <label>
          <span className="sr-only">Type</span>
          <select name="kind" defaultValue={s.kind ?? ""} className={select}>
            <option value="">Everything</option>
            {KIND_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Area</span>
          <select name="area" defaultValue={s.area ?? ""} className={select}>
            <option value="">All areas</option>
            {AREA_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Person</span>
          <select name="actor" defaultValue={s.actor ?? ""} className={select}>
            <option value="">Everyone</option>
            {actors.map((a) => (
              <option key={a.actorEmail} value={a.actorEmail ?? ""}>
                {a.actorName ?? a.actorEmail}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" size="sm" variant="subtle">
          Apply
        </Button>
        {filtered && (
          <Link
            href="/admin/activity"
            className="text-surface-muted dx-link px-2 text-sm font-bold"
          >
            Clear
          </Link>
        )}
      </form>

      {unavailable ? (
        <EmptyState
          icon={<History />}
          title="The activity log isn't set up yet"
          description="Run the database update for this release, then changes will be recorded here."
          className="bg-white"
        />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<History />}
          title={filtered ? "Nothing matches" : "No activity yet"}
          description={
            filtered
              ? "Try different filters."
              : "Changes and sign-ins will be recorded here."
          }
          className="bg-white"
        />
      ) : (
        <AdminCard padded={false}>
          <ol>
            {entries.map((e) => {
              const failed =
                e.action === "auth.login_failed" ||
                e.action === "auth.login_blocked";
              const reason =
                e.metadata &&
                typeof e.metadata === "object" &&
                "reason" in e.metadata
                  ? String((e.metadata as { reason?: unknown }).reason)
                  : null;
              return (
                <li
                  key={e.id}
                  className="border-surface-rule flex flex-col gap-1.5 border-b px-5 py-3.5 last:border-b-0 md:flex-row md:items-center md:gap-6 md:px-6"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="text-sm">
                      <strong>
                        {e.actorName ?? e.actorEmail ?? "Unknown"}
                      </strong>{" "}
                      <span className="text-surface-muted">·</span>{" "}
                      {e.summary ?? describeAction(e.action)}
                    </p>
                    <p className="text-surface-muted text-xs">
                      {e.actorName && e.actorEmail ? `${e.actorEmail} · ` : ""}
                      {e.ip ? `IP ${e.ip}` : ""}
                      {reason ? ` · ${reason.replace(/_/g, " ")}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {failed && <StatusPill tone="danger">Security</StatusPill>}
                    {e.area && (
                      <StatusPill>{AREA_LABEL[e.area] ?? e.area}</StatusPill>
                    )}
                    <time
                      dateTime={e.createdAt.toISOString()}
                      title={formatDate(e.createdAt, true)}
                      className="text-surface-muted w-24 text-right text-xs whitespace-nowrap"
                    >
                      {timeAgo(e.createdAt)}
                    </time>
                  </div>
                </li>
              );
            })}
          </ol>
        </AdminCard>
      )}

      {pages > 1 && (
        <nav
          aria-label="Pages"
          className="text-surface-muted mt-5 flex items-center justify-between text-sm"
        >
          <p>
            Page {page} of {pages} · {total} entries
          </p>
          <div className="flex gap-1">
            {page > 1 ? (
              <Link
                href={hrefFor(page - 1)}
                aria-label="Newer"
                className="text-surface-fg hover:bg-ice inline-flex size-9 items-center justify-center rounded-full bg-white ring-1 ring-black/[0.08]"
              >
                <ChevronLeft aria-hidden className="size-4" />
              </Link>
            ) : null}
            {page < pages ? (
              <Link
                href={hrefFor(page + 1)}
                aria-label="Older"
                className="text-surface-fg hover:bg-ice inline-flex size-9 items-center justify-center rounded-full bg-white ring-1 ring-black/[0.08]"
              >
                <ChevronRight aria-hidden className="size-4" />
              </Link>
            ) : null}
          </div>
        </nav>
      )}
    </>
  );
}
