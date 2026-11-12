import Link from "next/link";
import { cn } from "@/lib/utils";
import { RANGES, type Insights, type RangeKey } from "@/lib/analytics/insights";
import { formatBytes } from "@/lib/media/shared";
import { ChartCard, Legend } from "@/components/admin/charts/base";
import {
  ACCENT,
  SERIES,
  STATUS,
  TRAFFIC,
} from "@/components/admin/charts/palette";
import {
  ColumnChart,
  Funnel,
  Heatmap,
  LineChart,
  Pictogram,
  SegmentedBar,
  StackedBars,
} from "@/components/admin/charts/charts";
import { StatTile } from "@/components/admin/charts/stat-tile";
import { CustomRange } from "@/components/admin/charts/custom-range";

const MEDIA_COLORS = ["#007fc2", "#ff7a5c", "#34c9a0", "#8a8c88"];
const change = (cur: number, prev: number) =>
  prev === 0 ? (cur === 0 ? 0 : null) : Math.round(((cur - prev) / prev) * 100);
const regionName = (code: string) => {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
};
const DEVICE: Record<string, string> = {
  mobile: "Phones",
  tablet: "Tablets",
  desktop: "Computers",
};
const hourLabel = (h: number) =>
  h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;

/** Business insights for the dashboard, scoped by one date range. */
export function InsightsSection({ data }: { data: Insights }) {
  const labels = data.buckets.map((b) => b.label);
  const prevLabel =
    data.range === "365"
      ? "the year before"
      : data.days === 1
        ? "the day before"
        : `the ${data.days} days before`;
  const enquiriesTotal = data.enquiries
    ? data.enquiries.series.reduce(
        (n, s) => n + s.values.reduce((a, b) => a + b, 0),
        0,
      )
    : 0;
  const busiestHour =
    data.hours && data.hours.some((h) => h > 0)
      ? data.hours.indexOf(Math.max(...data.hours))
      : null;

  return (
    <section
      aria-labelledby="insights-title"
      className="mt-12 flex flex-col gap-6"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <h2 id="insights-title" className="dx-heading text-h3 font-normal">
            Insights
          </h2>
          <p className="text-surface-muted text-sm">
            {data.rangeLabel} · {data.periodLabel}. Lagos time.
          </p>
        </div>
        <nav
          aria-label="Date range"
          className="bg-charcoal/[0.06] flex w-fit rounded-full p-1"
        >
          {(Object.keys(RANGES) as RangeKey[]).map((k) => (
            <Link
              key={k}
              href={`/admin?range=${k}#insights-title`}
              scroll={false}
              aria-current={k === data.range ? "true" : undefined}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-bold whitespace-nowrap transition-colors",
                k === data.range
                  ? "text-royal bg-white shadow-sm"
                  : "text-surface-muted hover:text-surface-fg",
              )}
            >
              {k === "365" ? "12 months" : `${k} days`}
            </Link>
          ))}
          <CustomRange
            active={data.range === "custom"}
            from={data.from}
            to={data.to}
            today={data.today}
          />
        </nav>
      </div>

      {data.visitors && <VisitorsBlock data={data} prevLabel={prevLabel} />}

      {data.kpis.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {data.kpis.map((k) => (
            <StatTile
              key={k.key}
              label={k.label}
              value={k.value}
              delta={k.delta}
              upIsGood={k.upIsGood}
              trend={k.trend}
              href={k.href}
              periodLabel={prevLabel}
            />
          ))}
        </div>
      )}

      {data.enquiries && (
        <ChartCard
          title="Enquiries over time"
          description={`${enquiriesTotal.toLocaleString("en-GB")} in this period, by where they came from.`}
          legend={
            data.enquiries.series.length > 1 ? (
              <Legend
                line
                items={data.enquiries.series.map((s) => ({
                  label: s.label,
                  color: SERIES[s.key as keyof typeof SERIES],
                }))}
              />
            ) : undefined
          }
          empty={enquiriesTotal === 0 && "No enquiries in this period yet."}
          table={{
            head: ["Period", ...data.enquiries.series.map((s) => s.label)],
            rows: labels.map((l, i) => [
              l,
              ...data.enquiries!.series.map((s) => s.values[i]),
            ]),
          }}
        >
          <LineChart
            labels={labels}
            series={data.enquiries.series.map((s) => ({
              ...s,
              color: SERIES[s.key as keyof typeof SERIES],
            }))}
          />
        </ChartCard>
      )}

      {(data.hours || data.heat) && (
        <div className="grid gap-6 xl:grid-cols-2">
          {data.hours && (
            <ChartCard
              title="When enquiries arrive"
              description={
                busiestHour !== null
                  ? `Busiest hour: ${hourLabel(busiestHour)}–${hourLabel((busiestHour + 1) % 24)}. Good to know for reply times and posting.`
                  : "By hour of the day."
              }
              empty={enquiriesTotal === 0 && "Nothing to show for this period."}
              table={{
                head: ["Hour", "Enquiries"],
                rows: data.hours.map((v, h) => [hourLabel(h), v]),
              }}
            >
              <ColumnChart
                labels={data.hours.map((_, h) => hourLabel(h))}
                values={data.hours}
                color={ACCENT}
                valueLabel="enquiries"
                labelEvery={3}
              />
            </ChartCard>
          )}
          {data.heat && (
            <ChartCard
              title="Busiest days and times"
              description="Enquiries by weekday and hour: darker means more."
              empty={enquiriesTotal === 0 && "Nothing to show for this period."}
              table={{
                head: ["Day", "Enquiries", "Busiest hour"],
                rows: data.heat.map((row, d) => [
                  [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                  ][d],
                  row.reduce((a, b) => a + b, 0),
                  row.some((v) => v > 0)
                    ? hourLabel(row.indexOf(Math.max(...row)))
                    : "—",
                ]),
              }}
            >
              <Heatmap values={data.heat} valueLabel="enquiries" />
            </ChartCard>
          )}
        </div>
      )}

      {(data.schools || data.referrals) && (
        <div className="grid gap-6 xl:grid-cols-3">
          {data.schools && (
            <ChartCard
              title="School applications"
              description={`From application to a live website, this period.${data.schools.declined ? ` ${data.schools.declined} declined.` : ""}`}
              empty={
                data.schools.received === 0 && "No applications in this period."
              }
              table={{
                head: ["Stage", "Schools"],
                rows: [
                  ["Applied", data.schools.received],
                  ["Website started", data.schools.started],
                  ["Live", data.schools.live],
                  ["Declined", data.schools.declined],
                ],
              }}
            >
              <Funnel
                steps={[
                  { label: "Applied", value: data.schools.received },
                  { label: "Website started", value: data.schools.started },
                  { label: "Live", value: data.schools.live },
                ]}
              />
            </ChartCard>
          )}
          {data.referrals && (
            <ChartCard
              title="Referral links"
              description="What partners' links brought in this period."
              empty={
                data.referrals.visits === 0 &&
                "No referral visits in this period."
              }
              table={{
                head: ["Stage", "Count"],
                rows: [
                  ["Visits", data.referrals.visits],
                  ["Template picked", data.referrals.selected],
                  ["Applied", data.referrals.applied],
                  ["Went live", data.referrals.live],
                ],
              }}
            >
              <Funnel
                steps={[
                  { label: "Visits", value: data.referrals.visits },
                  { label: "Template picked", value: data.referrals.selected },
                  { label: "Applied", value: data.referrals.applied },
                  { label: "Went live", value: data.referrals.live },
                ]}
              />
            </ChartCard>
          )}
          {data.schools && (
            <ChartCard
              title="Schools on the web"
              description="Every school website we've built (all time)."
            >
              <Pictogram
                live={data.schools.liveTotal}
                inProgress={data.schools.inProgressTotal}
              />
            </ChartCard>
          )}
        </div>
      )}

      {(data.events || data.articles || data.media) && (
        <div className="grid gap-6 xl:grid-cols-3">
          {data.events && (
            <ChartCard
              title="Registrations by event"
              description="The events people signed up for this period."
              legend={
                <Legend
                  items={[
                    { label: "Accepted", color: STATUS.good },
                    { label: "Pending", color: STATUS.warning },
                    { label: "Declined", color: STATUS.critical },
                  ]}
                />
              }
              empty={
                data.events.rows.length === 0 &&
                "No registrations in this period."
              }
              table={{
                head: ["Event", "Accepted", "Pending", "Declined"],
                rows: data.events.rows.map((r) => [
                  r.title,
                  r.accepted,
                  r.pending,
                  r.declined,
                ]),
              }}
              className="xl:col-span-2 xl:self-start"
            >
              <StackedBars
                rows={data.events.rows.map((r) => ({
                  label: r.title,
                  values: {
                    accepted: r.accepted,
                    pending: r.pending,
                    declined: r.declined,
                  },
                }))}
                parts={[
                  { key: "accepted", label: "Accepted", color: STATUS.good },
                  { key: "pending", label: "Pending", color: STATUS.warning },
                  {
                    key: "declined",
                    label: "Declined",
                    color: STATUS.critical,
                  },
                ]}
              />
            </ChartCard>
          )}
          {(data.articles || data.media) && (
            <div className="flex min-w-0 flex-col gap-6">
              {data.articles && (
                <ChartCard
                  title="Articles published"
                  description={`${data.articles.reduce((a, b) => a + b, 0)} in this period.`}
                  empty={
                    data.articles.every((v) => v === 0) &&
                    "No articles published in this period."
                  }
                  table={{
                    head: ["Period", "Articles"],
                    rows: labels.map((l, i) => [l, data.articles![i]]),
                  }}
                >
                  <ColumnChart
                    labels={labels}
                    values={data.articles}
                    color={ACCENT}
                    valueLabel="articles"
                    height={180}
                  />
                </ChartCard>
              )}
              {data.media && (
                <ChartCard
                  title="Media library"
                  description={`${data.media.reduce((n, m) => n + m.count, 0).toLocaleString("en-GB")} files, ${formatBytes(data.media.reduce((n, m) => n + m.bytes, 0))} in all (now).`}
                  empty={data.media.length === 0 && "The library is empty."}
                  table={{
                    head: ["Kind", "Files", "Size"],
                    rows: data.media.map((m) => [
                      m.label,
                      m.count,
                      formatBytes(m.bytes),
                    ]),
                  }}
                >
                  <SegmentedBar
                    parts={[
                      ...data.media.slice(0, 3),
                      ...(data.media.length > 3
                        ? [
                            {
                              kind: "rest",
                              label: "Other",
                              bytes: data.media
                                .slice(3)
                                .reduce((n, m) => n + m.bytes, 0),
                              count: data.media
                                .slice(3)
                                .reduce((n, m) => n + m.count, 0),
                            },
                          ]
                        : []),
                    ].map((m, i) => ({
                      label: m.label,
                      value: m.bytes,
                      color: MEDIA_COLORS[i],
                      display: formatBytes(m.bytes),
                    }))}
                  />
                </ChartCard>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function VisitorsBlock({
  data,
  prevLabel,
}: {
  data: Insights;
  prevLabel: string;
}) {
  const v = data.visitors!;
  const labels = data.buckets.map((b) => b.label);
  const perVisit = v.totals.visits ? v.totals.views / v.totals.visits : 0;
  const prevPerVisit = v.previous.visits
    ? v.previous.views / v.previous.visits
    : 0;
  const nothing = v.totals.views === 0;
  const ranked = (
    rows: { key: string; count: number }[],
    label: (k: string) => string = (k) => k,
  ) => rows.map((r) => ({ label: label(r.key), values: { n: r.count } }));
  const one = [{ key: "n", label: "Count", color: ACCENT }];

  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-eyebrow text-surface-fg/80">Visitors</h3>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Visitors"
          value={v.totals.visitors}
          delta={change(v.totals.visitors, v.previous.visitors)}
          upIsGood
          trend={v.visitors}
          periodLabel={prevLabel}
        />
        <StatTile
          label="Visits"
          value={v.totals.visits}
          delta={change(v.totals.visits, v.previous.visits)}
          upIsGood
          trend={v.visitors}
          periodLabel={prevLabel}
        />
        <StatTile
          label="Page views"
          value={v.totals.views}
          delta={change(v.totals.views, v.previous.views)}
          upIsGood
          trend={v.views}
          periodLabel={prevLabel}
        />
        <StatTile
          label="Pages per visit"
          value={Math.round(perVisit * 10) / 10}
          delta={
            prevPerVisit
              ? Math.round(((perVisit - prevPerVisit) / prevPerVisit) * 100)
              : perVisit
                ? null
                : 0
          }
          upIsGood
          trend={v.views.map((n, i) => (v.visitors[i] ? n / v.visitors[i] : 0))}
          periodLabel={prevLabel}
        />
      </div>

      <ChartCard
        title="Visitors and page views"
        description="Visitors are counted once a day per device; page views count every page they open."
        legend={
          <Legend
            line
            items={[
              { label: "Visitors", color: TRAFFIC.visitors },
              { label: "Page views", color: TRAFFIC.views },
            ]}
          />
        }
        empty={
          nothing &&
          "No visits recorded in this period yet. Visits start counting once the site is live with this update."
        }
        table={{
          head: ["Period", "Visitors", "Page views"],
          rows: labels.map((l, i) => [l, v.visitors[i], v.views[i]]),
        }}
      >
        <LineChart
          labels={labels}
          series={[
            {
              key: "visitors",
              label: "Visitors",
              color: TRAFFIC.visitors,
              values: v.visitors,
            },
            {
              key: "views",
              label: "Page views",
              color: TRAFFIC.views,
              values: v.views,
            },
          ]}
        />
      </ChartCard>

      {!nothing && (
        <div className="grid gap-6 xl:grid-cols-3">
          <ChartCard
            title="Top pages"
            description="The pages opened most."
            table={{
              head: ["Page", "Views"],
              rows: v.pages.map((p) => [p.key, p.count]),
            }}
            className="xl:col-span-2"
          >
            <StackedBars rows={ranked(v.pages)} parts={one} />
          </ChartCard>
          <ChartCard
            title="Devices"
            description="What visitors browse on."
            table={{
              head: ["Device", "Visits"],
              rows: v.devices.map((d) => [DEVICE[d.key] ?? d.key, d.count]),
            }}
          >
            <SegmentedBar
              parts={v.devices.map((d, i) => ({
                label: DEVICE[d.key] ?? d.key,
                value: d.count,
                color: MEDIA_COLORS[i],
                display: d.count.toLocaleString("en-GB"),
              }))}
            />
          </ChartCard>
          <ChartCard
            title="Where visitors come from"
            description="The site that sent them, or Direct (typed in, bookmarks, apps)."
            table={{
              head: ["Source", "Visits"],
              rows: v.referrers.map((r) => [r.key, r.count]),
            }}
            className="xl:col-span-2"
          >
            <StackedBars rows={ranked(v.referrers)} parts={one} />
          </ChartCard>
          <ChartCard
            title="Countries"
            description="Where visits come from."
            empty={
              v.countries.length === 0 &&
              "Countries show once the site runs on Vercel."
            }
            table={{
              head: ["Country", "Visits"],
              rows: v.countries.map((c) => [regionName(c.key), c.count]),
            }}
          >
            <StackedBars rows={ranked(v.countries, regionName)} parts={one} />
          </ChartCard>
        </div>
      )}
    </div>
  );
}
