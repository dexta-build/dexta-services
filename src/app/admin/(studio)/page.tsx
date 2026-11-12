import { Suspense } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  FilePen,
  ImageOff,
  Inbox,
  Tag,
} from "lucide-react";
import prisma from "@/lib/prisma";
import { canAccess } from "@/lib/admin/permissions";
import { requirePageAccess } from "@/lib/admin/session";
import { describeAction, timeAgo } from "@/lib/admin/format";
import { canUseInbox, readInbox, type InboxItem } from "@/lib/inbox/inbox";
import { listPages } from "@/lib/content/registry";
import { getMediaHealth } from "@/lib/media/health";
import {
  AdminCard,
  PageHeader,
  StatusPill,
  type PillTone,
} from "@/components/admin/kit/layout";
import { Skeleton } from "@/components/admin/kit/display";
import { Button } from "@/components/site/button";
import { RecheckMediaButton } from "./dashboard-parts";
import { InsightsSection } from "./insights";
import {
  getInsights,
  parseRange,
  type RangeSpec,
} from "@/lib/analytics/insights";

export const metadata = { title: "Dashboard" };

async function safe<T>(fn: () => Promise<T>, fallback: T) {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

const TYPE: Record<InboxItem["source"], { label: string; tone: PillTone }> = {
  MESSAGE: { label: "Message", tone: "brand" },
  REGISTRATION: { label: "Registration", tone: "success" },
  APPLICATION: { label: "School application", tone: "royal" },
};

const dayTime = (d: Date, timeZone = "Africa/Lagos") =>
  d.toLocaleString("en-GB", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const inDays = (d: Date, now: number) => {
  const h = Math.round((d.getTime() - now) / 3_600_000);
  if (h < 24) return `in ${Math.max(1, h)} hour${h === 1 ? "" : "s"}`;
  const days = Math.round(h / 24);
  return `in ${days} day${days === 1 ? "" : "s"}`;
};

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const user = await requirePageAccess(null);
  const range = parseRange(await searchParams);
  const now = Date.now();
  const soon = new Date(now + 7 * 86_400_000);
  const can = {
    inbox: canUseInbox(user),
    events: canAccess(user, "events"),
    offers: canAccess(user, "offers"),
    thoughts: canAccess(user, "thoughts"),
    catalogue: canAccess(user, "catalogue"),
    media: canAccess(user, "media"),
    admin: user.role === "ADMIN",
  };

  const [inbox, events, offers, drafts, activity] = await Promise.all([
    can.inbox ? safe(() => readInbox(user), null) : null,
    can.events
      ? safe(
          () =>
            prisma.event.findMany({
              where: {
                dateTime: { gt: new Date(now) },
                status: { not: "DRAFT" },
              },
              orderBy: { dateTime: "asc" },
              take: 4,
              include: {
                _count: {
                  select: { registrations: { where: { status: "PENDING" } } },
                },
                registrations: {
                  where: { status: "ACCEPTED" },
                  select: { id: true },
                },
              },
            }),
          [],
        )
      : [],
    can.offers
      ? safe(
          () =>
            prisma.offer.findMany({
              where: {
                isVisible: true,
                endsAt: { gt: new Date(now), lte: soon },
              },
              orderBy: { endsAt: "asc" },
              take: 5,
            }),
          [],
        )
      : [],
    safe(async () => {
      const pages = await listPages();
      const [sections, articles, scheduled, eventDrafts, samples] =
        await Promise.all([
          prisma.pageSection.groupBy({
            by: ["page"],
            where: { hasDraft: true },
            _count: { _all: true },
          }),
          can.thoughts
            ? prisma.post.findMany({
                where: { status: "DRAFT" },
                orderBy: { updatedAt: "desc" },
                take: 3,
                select: { id: true, title: true, updatedAt: true },
              })
            : [],
          can.thoughts
            ? prisma.post.count({
                where: {
                  status: "PUBLISHED",
                  publishedAt: { gt: new Date(now) },
                },
              })
            : 0,
          can.events ? prisma.event.count({ where: { status: "DRAFT" } }) : 0,
          can.catalogue
            ? prisma.catalogueItem
                .count({ where: { isSample: true } })
                .catch(() => 0)
            : 0,
        ]);
      const pageDrafts = sections
        .map((s) => {
          const def = pages.find((p) => p.key === s.page);
          return def && canAccess(user, def.area)
            ? { key: def.key, label: def.label, count: s._count._all }
            : null;
        })
        .filter((p): p is { key: string; label: string; count: number } => !!p);
      const articleCount = can.thoughts
        ? await prisma.post.count({ where: { status: "DRAFT" } })
        : 0;
      return {
        pageDrafts,
        articles,
        articleCount,
        scheduled,
        eventDrafts,
        samples,
      };
    }, null),
    can.admin
      ? safe(
          () =>
            prisma.auditLog.findMany({
              where: { NOT: { action: { startsWith: "auth." } } },
              orderBy: { createdAt: "desc" },
              take: 8,
            }),
          [],
        )
      : [],
  ]);

  const open = inbox?.items.filter((i) => !i.done) ?? [];
  const unread = open.filter((i) => !i.read);
  const latest = [...unread, ...open.filter((i) => i.read)].slice(0, 5);
  const draftTotal = drafts
    ? drafts.pageDrafts.reduce((n, p) => n + p.count, 0) +
      drafts.articleCount +
      drafts.eventDrafts
    : 0;
  const firstName = user.name.split(/\s+/)[0] || "there";

  const stats = [
    can.inbox && {
      label: "New in the inbox",
      value: unread.length,
      href: "/admin/inbox",
      icon: Inbox,
      alert: unread.length > 0,
    },
    can.events && {
      label: "Upcoming events",
      value: events.length,
      href: "/admin/events",
      icon: CalendarDays,
    },
    can.offers && {
      label: "Offers ending this week",
      value: offers.length,
      href: "/admin/offers",
      icon: Tag,
      alert: offers.length > 0,
    },
    drafts && {
      label: "Drafts waiting",
      value: draftTotal,
      href: drafts.articleCount ? "/admin/thoughts" : "/admin/pages",
      icon: FilePen,
    },
  ].filter(Boolean) as {
    label: string;
    value: number;
    href: string;
    icon: typeof Inbox;
    alert?: boolean;
  }[];

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome back, *${firstName}*`}
        description="What needs you today. Press Ctrl K to jump to any page."
        actions={
          <Button href="/" external variant="outline" size="sm" arrow>
            View site
          </Button>
        }
      />

      {stats.length > 0 && (
        <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.label}
                href={s.href}
                className="group flex items-center gap-4 rounded-[10px] bg-white p-5 ring-1 ring-black/[0.06] transition-shadow hover:shadow-[0_18px_40px_-24px_rgb(0_8_107/0.45)]"
              >
                <span
                  className={
                    s.alert
                      ? "bg-royal inline-flex size-11 items-center justify-center rounded-full text-white"
                      : "bg-ice text-royal inline-flex size-11 items-center justify-center rounded-full"
                  }
                >
                  <Icon aria-hidden className="size-5" />
                </span>
                <span className="flex flex-col">
                  <span className="text-[1.75rem] leading-none font-bold tracking-[-0.02em]">
                    {s.value}
                  </span>
                  <span className="text-surface-muted mt-1 text-sm">
                    {s.label}
                  </span>
                </span>
                <ArrowUpRight
                  aria-hidden
                  className="text-surface-muted ml-auto size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
            );
          })}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {can.inbox && (
          <AdminCard
            title="Inbox"
            description={
              unread.length
                ? `${unread.length} new, waiting for a reply`
                : "You're all caught up."
            }
            actions={
              <Button href="/admin/inbox" variant="ghost" size="sm">
                Open inbox
              </Button>
            }
          >
            {latest.length === 0 ? (
              <Empty text="Nothing waiting. New messages, registrations and applications land here." />
            ) : (
              <ul className="flex flex-col">
                {latest.map((i) => (
                  <li
                    key={i.key}
                    className="border-surface-rule border-b last:border-b-0"
                  >
                    <Link
                      href={`/admin/inbox?item=${encodeURIComponent(i.key)}`}
                      className="hover:bg-canvas -mx-2 flex items-start gap-3 rounded-[8px] px-2 py-2.5"
                    >
                      <span
                        aria-hidden
                        className={`mt-1.5 size-2 shrink-0 rounded-full ${i.read ? "" : "bg-brand"}`}
                      />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-sm ${i.read ? "" : "font-bold"}`}
                          >
                            {i.name}
                          </span>
                          <StatusPill tone={TYPE[i.source].tone}>
                            {TYPE[i.source].label}
                          </StatusPill>
                        </span>
                        <span className="text-surface-muted truncate text-xs">
                          {i.subject}
                        </span>
                      </span>
                      <span className="text-surface-muted shrink-0 text-xs">
                        {timeAgo(i.receivedAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>
        )}

        {can.events && (
          <AdminCard
            title="Upcoming events"
            actions={
              <Button href="/admin/events" variant="ghost" size="sm">
                All events
              </Button>
            }
          >
            {events.length === 0 ? (
              <Empty
                text="No events coming up."
                action={{ href: "/admin/events/new", label: "Plan one" }}
              />
            ) : (
              <ul className="flex flex-col">
                {events.map((e) => (
                  <li
                    key={e.id}
                    className="border-surface-rule border-b last:border-b-0"
                  >
                    <Link
                      href={`/admin/events/${e.id}`}
                      className="hover:bg-canvas -mx-2 flex items-center gap-3 rounded-[8px] px-2 py-2.5"
                    >
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-sm font-bold">
                          {e.title}
                        </span>
                        <span className="text-surface-muted text-xs">
                          {dayTime(e.dateTime, e.timezone)} ·{" "}
                          {inDays(e.dateTime, now)}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1 text-xs">
                        <span>
                          <b>{e.registrations.length}</b>
                          {e.attendeeLimit ? ` / ${e.attendeeLimit}` : ""} in
                        </span>
                        {e._count.registrations > 0 && (
                          <StatusPill tone="warning">
                            {e._count.registrations} to review
                          </StatusPill>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>
        )}

        {can.offers && (
          <AdminCard
            title="Offers ending soon"
            description="Live offers whose countdown ends in the next 7 days."
            actions={
              <Button href="/admin/offers" variant="ghost" size="sm">
                Offers
              </Button>
            }
          >
            {offers.length === 0 ? (
              <Empty text="No offer ends this week." />
            ) : (
              <ul className="flex flex-col">
                {offers.map((o) => (
                  <li
                    key={o.id}
                    className="border-surface-rule flex items-center justify-between gap-3 border-b py-2.5 last:border-b-0"
                  >
                    <span className="truncate text-sm font-bold">{o.name}</span>
                    <StatusPill tone="warning" dot>
                      Ends {inDays(o.endsAt!, now)}
                    </StatusPill>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>
        )}

        {drafts && (
          <AdminCard
            title="Drafts waiting"
            description="Saved but not live yet."
          >
            {draftTotal === 0 && !drafts.scheduled && !drafts.samples ? (
              <Empty text="No drafts. Everything you've saved is live." />
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {drafts.articles.map((p) => (
                  <DraftRow
                    key={p.id}
                    href={`/admin/thoughts/${p.id}`}
                    label={p.title.replace(/\*/g, "") || "Untitled article"}
                    note={`Article · edited ${timeAgo(p.updatedAt)}`}
                  />
                ))}
                {drafts.articleCount > drafts.articles.length && (
                  <DraftRow
                    href="/admin/thoughts"
                    label={`${drafts.articleCount - drafts.articles.length} more article drafts`}
                  />
                )}
                {drafts.scheduled > 0 && (
                  <DraftRow
                    href="/admin/thoughts"
                    label={`${drafts.scheduled} article${drafts.scheduled === 1 ? "" : "s"} scheduled`}
                    note="Will go live by themselves"
                  />
                )}
                {drafts.pageDrafts.map((p) => (
                  <DraftRow
                    key={p.key}
                    href={`/admin/pages/${p.key}`}
                    label={p.label}
                    note={`${p.count} section${p.count === 1 ? "" : "s"} with unpublished changes`}
                  />
                ))}
                {drafts.eventDrafts > 0 && (
                  <DraftRow
                    href="/admin/events"
                    label={`${drafts.eventDrafts} event${drafts.eventDrafts === 1 ? "" : "s"} in draft`}
                  />
                )}
                {drafts.samples > 0 && (
                  <DraftRow
                    href="/admin/catalogues"
                    label={`${drafts.samples} sample catalogue designs`}
                    note="Placeholder prices to replace"
                  />
                )}
              </ul>
            )}
          </AdminCard>
        )}

        {can.media && (
          <Suspense
            fallback={
              <AdminCard title="Broken media">
                <Skeleton className="h-16" />
              </AdminCard>
            }
          >
            <BrokenMedia />
          </Suspense>
        )}

        {can.admin && (
          <AdminCard
            title="Recent changes"
            actions={
              <Button href="/admin/activity" variant="ghost" size="sm">
                See all
              </Button>
            }
          >
            {activity.length === 0 ? (
              <Empty text="Changes made in the admin will show up here." />
            ) : (
              <ol className="flex flex-col">
                {activity.map((a) => (
                  <li
                    key={a.id}
                    className="border-surface-rule border-b py-2.5 last:border-b-0"
                  >
                    <p className="text-sm">
                      <strong>
                        {a.actorName ?? a.actorEmail ?? "Someone"}
                      </strong>{" "}
                      <span className="text-surface-muted">·</span>{" "}
                      {a.summary ?? describeAction(a.action)}
                    </p>
                    <p className="text-surface-muted text-xs">
                      <time dateTime={a.createdAt.toISOString()}>
                        {timeAgo(a.createdAt)}
                      </time>
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </AdminCard>
        )}
      </div>

      <Suspense key={JSON.stringify(range)} fallback={<InsightsLoading />}>
        <Insights user={user} range={range} />
      </Suspense>
    </>
  );
}

async function Insights({
  user,
  range,
}: {
  user: Awaited<ReturnType<typeof requirePageAccess>>;
  range: RangeSpec;
}) {
  const data = await safe(() => getInsights(user, range), null);
  if (!data) return null;
  return <InsightsSection data={data} />;
}

function InsightsLoading() {
  return (
    <div className="mt-12 flex flex-col gap-6" aria-busy="true">
      <Skeleton className="h-8 w-40" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}

function Empty({
  text,
  action,
}: {
  text: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="text-surface-muted flex flex-col items-start gap-3 text-sm">
      <p className="flex items-center gap-2">
        <CheckCircle2 aria-hidden className="text-mint-deep size-4" />
        {text}
      </p>
      {action && (
        <Button href={action.href} size="sm" variant="subtle">
          {action.label}
        </Button>
      )}
    </div>
  );
}

function DraftRow({
  href,
  label,
  note,
}: {
  href: string;
  label: string;
  note?: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="hover:bg-canvas -mx-2 flex items-center justify-between gap-3 rounded-[8px] px-2 py-2"
      >
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-bold">{label}</span>
          {note && <span className="text-surface-muted text-xs">{note}</span>}
        </span>
        <ArrowUpRight
          aria-hidden
          className="text-surface-muted size-4 shrink-0"
        />
      </Link>
    </li>
  );
}

/** Streams in: the check talks to Cloudinary (cached until checked again). */
async function BrokenMedia() {
  const health = await getMediaHealth();
  const count = health.missing.length + health.more;
  return (
    <AdminCard
      title="Broken media"
      description={
        health.error
          ? undefined
          : count
            ? `${count} of ${health.total} files the site uses can't be found on Cloudinary.`
            : `All ${health.total} Cloudinary files the site uses are there.`
      }
      actions={<RecheckMediaButton />}
    >
      {health.error ? (
        <p className="flex items-start gap-2 text-sm text-[#9a6700]">
          <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
          {health.error}
        </p>
      ) : count === 0 ? (
        <Empty text="No missing files." />
      ) : (
        <ul className="flex flex-col">
          {health.missing.map((m) => (
            <li
              key={m.id}
              className="border-surface-rule flex items-start gap-3 border-b py-2.5 last:border-b-0"
            >
              <ImageOff
                aria-hidden
                className="text-surface-muted mt-0.5 size-4 shrink-0"
              />
              <span className="flex min-w-0 flex-col gap-1">
                <span className="truncate text-sm font-bold" title={m.id}>
                  {m.id.split("/").pop()}
                </span>
                <span className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                  {m.usage.length === 0 ? (
                    <span className="text-surface-muted">
                      Not found in current content
                    </span>
                  ) : (
                    m.usage.map((u) =>
                      u.href ? (
                        <Link
                          key={u.label}
                          href={u.href}
                          className="text-royal underline"
                        >
                          {u.label}
                        </Link>
                      ) : (
                        <span key={u.label} className="text-surface-muted">
                          {u.label}
                        </span>
                      ),
                    )
                  )}
                </span>
              </span>
            </li>
          ))}
          {health.more > 0 && (
            <li className="text-surface-muted pt-2.5 text-xs">
              …and {health.more} more. Replace them where they&apos;re used, or
              re-upload them in the media library.
            </li>
          )}
        </ul>
      )}
      <p className="text-surface-muted mt-3 text-xs">
        Checked {timeAgo(health.checkedAt)}.
      </p>
    </AdminCard>
  );
}
