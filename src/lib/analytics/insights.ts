import "server-only";
import prisma from "@/lib/prisma";
import { canAccess, type AdminIdentity } from "@/lib/admin/permissions";
import { canUseInbox } from "@/lib/inbox/inbox";

/**
 * Business insights for the dashboard, worked out from what the site
 * records: enquiries (contact messages, event registrations, school
 * applications), the schools pipeline and referrals, events, emails,
 * articles and the media library. Each block is only built for people who
 * can see that area. Times are Lagos time.
 */

export const RANGES = {
  "7": { days: 7, label: "Last 7 days" },
  "30": { days: 30, label: "Last 30 days" },
  "90": { days: 90, label: "Last 90 days" },
  "365": { days: 365, label: "Last 12 months" },
} as const;
export type RangeKey = keyof typeof RANGES;
export const isRange = (v: unknown): v is RangeKey =>
  typeof v === "string" && v in RANGES;

const TZ = "Africa/Lagos";
const DAY = 86_400_000;

/** Lagos calendar parts for a date (Lagos has no daylight saving: UTC+1). */
function lagos(d: Date) {
  const t = new Date(d.getTime() + 3_600_000);
  return {
    y: t.getUTCFullYear(),
    m: t.getUTCMonth(),
    d: t.getUTCDate(),
    h: t.getUTCHours(),
    wd: (t.getUTCDay() + 6) % 7, // Monday = 0
  };
}

type Bucket = { key: string; label: string; start: number; end: number };

/** Start of a Lagos calendar day, as a UTC timestamp. */
const lagosMidnight = (y: number, m: number, d: number) =>
  Date.UTC(y, m, d) - 3_600_000;

/** "2026-03-14" as the start of that Lagos day, or null if it isn't a date. */
function parseDay(v: string | undefined) {
  const m = v && /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]) - 1, Number(m[3])];
  const t = lagosMidnight(y, mo, d);
  const back = lagos(new Date(t));
  return back.y === y && back.m === mo && back.d === d ? t : null;
}

const isoDay = (t: number) => {
  const p = lagos(new Date(t));
  return `${p.y}-${String(p.m + 1).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
};

/** The longest custom range (about 3 years) — keeps the page quick. */
const MAX_CUSTOM_DAYS = 1100;

export type RangeSpec =
  | { kind: "preset"; key: RangeKey }
  | { kind: "custom"; from: string; to: string };

/**
 * The range from the address: ?range=7|30|90|365, or ?from=YYYY-MM-DD&to=…
 * for a custom range (to ≥ from, not in the future, at most ~3 years).
 */
export function parseRange(
  params: { range?: string; from?: string; to?: string },
  now = Date.now(),
): RangeSpec {
  const f = parseDay(params.from);
  const t = parseDay(params.to);
  const today = parseDay(isoDay(now))!;
  if (f !== null && t !== null) {
    // Dates the wrong way round are swapped; the end can't be in the
    // future; a range over the limit keeps its latest part.
    const lo = Math.min(f, t);
    const hi = Math.min(Math.max(f, t), today);
    const to = Math.max(hi, Math.min(lo, today));
    const from = Math.max(Math.min(lo, to), to - (MAX_CUSTOM_DAYS - 1) * DAY);
    return { kind: "custom", from: isoDay(from), to: isoDay(to) };
  }
  return { kind: "preset", key: isRange(params.range) ? params.range : "30" };
}

/** The period as [start, end) timestamps (Lagos days, today included). */
function windowFor(spec: RangeSpec, now: number) {
  const p = lagos(new Date(now));
  const tomorrow = lagosMidnight(p.y, p.m, p.d) + DAY;
  if (spec.kind === "custom")
    return { start: parseDay(spec.from)!, end: parseDay(spec.to)! + DAY };
  if (spec.key === "365")
    // The last 12 calendar months, this one included.
    return { start: lagosMidnight(p.y, p.m - 11, 1), end: tomorrow };
  return { start: tomorrow - RANGES[spec.key].days * DAY, end: tomorrow };
}

/** Days up to a month, weeks up to ~4 months, months beyond that. */
function buckets(start: number, end: number): Bucket[] {
  const out: Bucket[] = [];
  const days = Math.round((end - start) / DAY);
  const fmtDay = (ms: number) =>
    new Date(ms).toLocaleDateString("en-GB", {
      timeZone: TZ,
      day: "numeric",
      month: "short",
    });
  if (days <= 31) {
    for (let t = start; t < end; t += DAY)
      out.push({ key: String(t), label: fmtDay(t), start: t, end: t + DAY });
  } else if (days <= 120) {
    // Whole weeks counted back from the end; the first may be shorter.
    for (let e = end; e > start; e -= 7 * DAY) {
      const s = Math.max(start, e - 7 * DAY);
      out.unshift({
        key: String(s),
        label: `w/c ${fmtDay(s)}`,
        start: s,
        end: e,
      });
    }
  } else {
    const a = lagos(new Date(start));
    const z = lagos(new Date(end - 1));
    const longRange = z.y !== a.y;
    for (let y = a.y, m = a.m; y < z.y || (y === z.y && m <= z.m); m++) {
      if (m > 11) {
        m = 0;
        y++;
        if (y > z.y || (y === z.y && m > z.m)) break;
      }
      const s = Math.max(start, lagosMidnight(y, m, 1));
      const e = Math.min(end, lagosMidnight(y, m + 1, 1));
      out.push({
        key: String(s),
        label: new Date(lagosMidnight(y, m, 1) + 3_600_000).toLocaleDateString(
          "en-GB",
          {
            timeZone: "UTC",
            month: "short",
            year: longRange ? "2-digit" : undefined,
          },
        ),
        start: s,
        end: e,
      });
    }
  }
  return out;
}

function count(bs: Bucket[], dates: Date[]) {
  const values = bs.map(() => 0);
  for (const d of dates) {
    const t = d.getTime();
    const i = bs.findIndex((b) => t >= b.start && t < b.end);
    if (i >= 0) values[i]++;
  }
  return values;
}

const pct = (cur: number, prev: number) =>
  prev === 0 ? (cur === 0 ? 0 : null) : Math.round(((cur - prev) / prev) * 100);

export type Kpi = {
  key: string;
  label: string;
  value: number;
  /** % change vs the previous period; null when there was nothing before. */
  delta: number | null;
  /** Up is good (enquiries) — used to colour the change. */
  upIsGood: boolean;
  trend: number[];
  href?: string;
};

export type Insights = {
  range: RangeKey | "custom";
  /** The period's first and last day (YYYY-MM-DD), for the custom picker. */
  from: string;
  to: string;
  /** Today in Lagos (YYYY-MM-DD): the latest day a custom range can end. */
  today: string;
  days: number;
  rangeLabel: string;
  periodLabel: string;
  buckets: { key: string; label: string }[];
  kpis: Kpi[];
  enquiries: {
    series: { key: string; label: string; values: number[] }[];
  } | null;
  hours: number[] | null;
  heat: number[][] | null; // [weekday][hour]
  schools: {
    received: number;
    started: number;
    live: number;
    declined: number;
    liveTotal: number;
    inProgressTotal: number;
  } | null;
  referrals: {
    visits: number;
    selected: number;
    applied: number;
    live: number;
  } | null;
  events: {
    rows: {
      id: string;
      title: string;
      accepted: number;
      pending: number;
      declined: number;
    }[];
  } | null;
  articles: number[] | null;
  visitors: {
    visitors: number[];
    views: number[];
    totals: { visitors: number; visits: number; views: number };
    previous: { visitors: number; visits: number; views: number };
    pages: { key: string; count: number }[];
    referrers: { key: string; count: number }[];
    devices: { key: string; count: number }[];
    countries: { key: string; count: number }[];
  } | null;
  media: { kind: string; label: string; bytes: number; count: number }[] | null;
};

export async function getInsights(
  user: AdminIdentity,
  spec: RangeSpec,
): Promise<Insights> {
  const now = Date.now();
  const win = windowFor(spec, now);
  const bs = buckets(win.start, win.end);
  const from = new Date(win.start);
  const until = new Date(win.end);
  const prevFrom = new Date(win.start - (win.end - win.start));
  const can = {
    inbox: canUseInbox(user),
    contact: canAccess(user, "contact") || canAccess(user, "inbox"),
    events: canAccess(user, "events"),
    schools: canAccess(user, "schools"),
    thoughts: canAccess(user, "thoughts"),
    media: canAccess(user, "media"),
  };
  const since = { createdAt: { gte: prevFrom, lt: until } };
  const none = Promise.resolve([] as { createdAt: Date }[]);

  const [messages, regs, apps, emails] = await Promise.all([
    can.contact
      ? prisma.contactMessage.findMany({
          where: since,
          select: { createdAt: true },
        })
      : none,
    can.events
      ? prisma.eventRegistration.findMany({
          where: since,
          select: {
            createdAt: true,
            status: true,
            eventId: true,
            event: { select: { title: true } },
          },
        })
      : Promise.resolve(
          [] as {
            createdAt: Date;
            status: string;
            eventId: string;
            event: { title: string };
          }[],
        ),
    can.schools
      ? prisma.schoolWebsiteApplication.findMany({
          where: since,
          select: { createdAt: true, status: true },
        })
      : Promise.resolve([] as { createdAt: Date; status: string }[]),
    can.inbox || can.events
      ? prisma.outboundEmail
          .findMany({
            where: { ...since, status: "SENT" },
            select: { createdAt: true },
          })
          .catch(() => [] as { createdAt: Date }[])
      : none,
  ]);

  const split = <T extends { createdAt: Date }>(rows: T[]) => {
    const cur = rows.filter((r) => r.createdAt >= from);
    const prev = rows.filter((r) => r.createdAt < from);
    return { cur, prev };
  };
  const m = split(messages);
  const r = split(regs);
  const a = split(apps);
  const e = split(emails);

  const enquiryDates = [
    ...m.cur.map((x) => x.createdAt),
    ...r.cur.map((x) => x.createdAt),
    ...a.cur.map((x) => x.createdAt),
  ];
  const anyEnquiries = can.contact || can.events || can.schools;

  const kpis: Kpi[] = [];
  if (anyEnquiries)
    kpis.push({
      key: "enquiries",
      label: "Enquiries",
      value: enquiryDates.length,
      delta: pct(
        enquiryDates.length,
        m.prev.length + r.prev.length + a.prev.length,
      ),
      upIsGood: true,
      trend: count(bs, enquiryDates),
      href: can.inbox ? "/admin/inbox" : undefined,
    });
  if (can.contact)
    kpis.push({
      key: "messages",
      label: "Contact messages",
      value: m.cur.length,
      delta: pct(m.cur.length, m.prev.length),
      upIsGood: true,
      trend: count(
        bs,
        m.cur.map((x) => x.createdAt),
      ),
    });
  if (can.events)
    kpis.push({
      key: "registrations",
      label: "Event registrations",
      value: r.cur.length,
      delta: pct(r.cur.length, r.prev.length),
      upIsGood: true,
      trend: count(
        bs,
        r.cur.map((x) => x.createdAt),
      ),
      href: "/admin/registrations",
    });
  if (can.schools)
    kpis.push({
      key: "applications",
      label: "School applications",
      value: a.cur.length,
      delta: pct(a.cur.length, a.prev.length),
      upIsGood: true,
      trend: count(
        bs,
        a.cur.map((x) => x.createdAt),
      ),
      href: "/admin/we-brand-schools/applications",
    });
  if (can.inbox || can.events)
    kpis.push({
      key: "emails",
      label: "Emails sent",
      value: e.cur.length,
      delta: pct(e.cur.length, e.prev.length),
      upIsGood: true,
      trend: count(
        bs,
        e.cur.map((x) => x.createdAt),
      ),
    });

  // When enquiries arrive.
  let hours: number[] | null = null;
  let heat: number[][] | null = null;
  if (anyEnquiries) {
    hours = Array.from({ length: 24 }, () => 0);
    heat = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
    for (const d of enquiryDates) {
      const p = lagos(d);
      hours[p.h]++;
      heat[p.wd][p.h]++;
    }
  }

  // Schools pipeline and referrals.
  let schools: Insights["schools"] = null;
  let referrals: Insights["referrals"] = null;
  if (can.schools) {
    const [liveTotal, inProgressTotal, refEvents] = await Promise.all([
      prisma.schoolWebsiteApplication.count({ where: { status: "LIVE" } }),
      prisma.schoolWebsiteApplication.count({
        where: { status: "IN_PROGRESS" },
      }),
      prisma.referralEvent
        .groupBy({
          by: ["eventType"],
          where: { createdAt: { gte: from, lt: until } },
          _count: { _all: true },
        })
        .catch(() => []),
    ]);
    const st = (s: string) => a.cur.filter((x) => x.status === s).length;
    schools = {
      received: a.cur.length,
      started: st("IN_PROGRESS") + st("LIVE"),
      live: st("LIVE"),
      declined: st("DECLINED"),
      liveTotal,
      inProgressTotal,
    };
    const ev = (t: string) =>
      refEvents.find((x) => x.eventType === t)?._count._all ?? 0;
    referrals = {
      visits: ev("VISIT"),
      selected: ev("TEMPLATE_SELECTED"),
      applied: ev("APPLICATION_SUBMITTED"),
      live: ev("SITE_LIVE"),
    };
  }

  // Registrations per event (top 6 in the period).
  let events: Insights["events"] = null;
  if (can.events) {
    const byEvent = new Map<
      string,
      {
        id: string;
        title: string;
        accepted: number;
        pending: number;
        declined: number;
      }
    >();
    for (const x of r.cur) {
      const row = byEvent.get(x.eventId) ?? {
        id: x.eventId,
        title: x.event.title,
        accepted: 0,
        pending: 0,
        declined: 0,
      };
      if (x.status === "ACCEPTED") row.accepted++;
      else if (x.status === "DECLINED") row.declined++;
      else row.pending++;
      byEvent.set(x.eventId, row);
    }
    events = {
      rows: [...byEvent.values()]
        .sort(
          (p, q) =>
            q.accepted +
            q.pending +
            q.declined -
            (p.accepted + p.pending + p.declined),
        )
        .slice(0, 6),
    };
  }

  // Articles published in the period.
  let articles: number[] | null = null;
  if (can.thoughts) {
    const posts = await prisma.post
      .findMany({
        where: {
          status: "PUBLISHED",
          publishedAt: { gte: from, lt: new Date(Math.min(win.end, now)) },
        },
        select: { publishedAt: true },
      })
      .catch(() => []);
    articles = count(bs, posts.map((p) => p.publishedAt!).filter(Boolean));
  }

  // Visitors (Admins): daily totals from the site's own analytics.
  let visitors: Insights["visitors"] = null;
  if (user.role === "ADMIN") {
    const dayDate = (t: number) => new Date(`${isoDay(t)}T00:00:00Z`);
    const rows = await prisma.analyticsCount
      .findMany({
        where: {
          day: {
            gte: dayDate(prevFrom.getTime()),
            lt: dayDate(win.end),
          },
        },
      })
      .catch(() => null);
    if (rows) {
      // A stored day is a Lagos calendar day; this is its start.
      const startOf = (d: Date) => d.getTime() - 3_600_000;
      const cur = rows.filter((r) => startOf(r.day) >= win.start);
      const prev = rows.filter((r) => startOf(r.day) < win.start);
      const sum = (list: typeof rows, kind: string) =>
        list.filter((r) => r.kind === kind).reduce((n, r) => n + r.count, 0);
      const series = (kind: string) =>
        bs.map((b) =>
          cur
            .filter(
              (r) =>
                r.kind === kind &&
                startOf(r.day) >= b.start &&
                startOf(r.day) < b.end,
            )
            .reduce((n, r) => n + r.count, 0),
        );
      const top = (kind: string, n: number) => {
        const m = new Map<string, number>();
        for (const r of cur)
          if (r.kind === kind) m.set(r.key, (m.get(r.key) ?? 0) + r.count);
        return [...m]
          .map(([key, count]) => ({ key, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, n);
      };
      visitors = {
        visitors: series("visitors"),
        views: series("views"),
        totals: {
          visitors: sum(cur, "visitors"),
          visits: sum(cur, "visits"),
          views: sum(cur, "views"),
        },
        previous: {
          visitors: sum(prev, "visitors"),
          visits: sum(prev, "visits"),
          views: sum(prev, "views"),
        },
        pages: top("page", 8),
        referrers: top("referrer", 6),
        devices: top("device", 3),
        countries: top("country", 6),
      };
    }
  }

  // What the media library holds (now).
  let media: Insights["media"] = null;
  if (can.media) {
    const rows = await prisma.mediaAsset
      .groupBy({ by: ["kind"], _sum: { bytes: true }, _count: { _all: true } })
      .catch(() => []);
    const LABEL: Record<string, string> = {
      IMAGE: "Images",
      VIDEO: "Videos",
      DOCUMENT: "Documents",
      AUDIO: "Audio",
      MODEL: "3D models",
      OTHER: "Other files",
    };
    media = rows
      .map((x) => ({
        kind: x.kind,
        label: LABEL[x.kind] ?? x.kind,
        bytes: x._sum.bytes ?? 0,
        count: x._count._all,
      }))
      .sort((p, q) => q.bytes - p.bytes);
  }

  const fmt = (t: number) =>
    new Date(t).toLocaleDateString("en-GB", {
      timeZone: TZ,
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  const days = Math.round((win.end - win.start) / DAY);

  return {
    range: spec.kind === "custom" ? "custom" : spec.key,
    from: isoDay(win.start),
    to: isoDay(win.end - 1),
    today: isoDay(now),
    days,
    rangeLabel:
      spec.kind === "custom" ? "Custom range" : RANGES[spec.key].label,
    periodLabel: `${fmt(win.start)} – ${fmt(win.end - 1)}`,
    buckets: bs.map((b) => ({ key: b.key, label: b.label })),
    kpis,
    enquiries: anyEnquiries
      ? {
          series: [
            can.contact && {
              key: "messages",
              label: "Contact messages",
              values: count(
                bs,
                m.cur.map((x) => x.createdAt),
              ),
            },
            can.events && {
              key: "registrations",
              label: "Event registrations",
              values: count(
                bs,
                r.cur.map((x) => x.createdAt),
              ),
            },
            can.schools && {
              key: "applications",
              label: "School applications",
              values: count(
                bs,
                a.cur.map((x) => x.createdAt),
              ),
            },
          ].filter(Boolean) as {
            key: string;
            label: string;
            values: number[];
          }[],
        }
      : null,
    hours,
    heat,
    schools,
    referrals,
    events,
    articles,
    visitors,
    media,
  };
}
