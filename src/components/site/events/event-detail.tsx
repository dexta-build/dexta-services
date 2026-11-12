import Link from "next/link";
import {
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  Globe2,
  MapPin,
  Users,
} from "lucide-react";
import { Button } from "../button";
import { Container } from "../container";
import { Eyebrow } from "../eyebrow";
import { Heading } from "../heading";
import { MediaAsset } from "../media-asset";
import {
  EVENT_PAGE_LABELS,
  type EventPageLabels,
} from "@/lib/site/event-labels";

export type EventDetailProps = {
  title: string;
  description: string;
  /** Date and time in the event's time zone, ready to show. */
  dateLabel: string;
  location: string;
  format: string;
  image: string;
  ended: boolean;
  spacesLabel: string;
  calendarHref: string;
  /** Sample events (development only) get a small label. */
  sample?: boolean;
  /** The registration form (shown while the event hasn't ended). */
  registration: React.ReactNode;
};

/**
 * Event page: photo hero with the title and details, "About this event"
 * with a details grid and calendar link, and the registration form beside
 * it (sticky on desktop). After the event, the form becomes "ended".
 */
export function EventDetail({
  title,
  description,
  dateLabel,
  location,
  format,
  image,
  ended,
  spacesLabel,
  calendarHref,
  sample,
  registration,
  labels: L = EVENT_PAGE_LABELS,
}: EventDetailProps & { labels?: EventPageLabels }) {
  return (
    <main className="dx-site">
      <section
        data-surface="royal"
        className="bg-surface text-surface-fg relative isolate flex min-h-[24rem] items-end overflow-hidden md:min-h-[30rem]"
      >
        <span className="absolute inset-0 -z-20">
          <MediaAsset
            media={{ kind: "image", src: image, alt: "" }}
            sizes="100vw"
            priority
          />
        </span>
        <span
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-[#00042f]/95 via-[#00042f]/60 to-[#00042f]/20"
        />
        <Container className="flex flex-col gap-5 pt-24 pb-10 md:pb-14">
          <nav aria-label="Breadcrumb">
            <ol className="text-surface-fg/75 flex items-center gap-1 text-sm">
              <li>
                <Link href="/events" className="dx-link hover:text-surface-fg">
                  Events
                </Link>
              </li>
              <li className="flex min-w-0 items-center gap-1">
                <ChevronRight aria-hidden className="size-3.5 shrink-0" />
                <span aria-current="page" className="truncate">
                  {title}
                </span>
              </li>
            </ol>
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={
                ended
                  ? "bg-surface-fg/15 rounded-full px-3 py-1 text-xs font-bold"
                  : "bg-brand-cyan text-royal rounded-full px-3 py-1 text-xs font-bold"
              }
            >
              {ended ? L.ended : dateLabel}
            </span>
            <span className="border-surface-fg/40 rounded-full border px-3 py-1 text-xs font-bold">
              {format}
            </span>
            {sample && (
              <span className="bg-surface-fg/15 rounded-full px-3 py-1 text-xs font-bold">
                Sample event
              </span>
            )}
          </div>
          <Heading size="display" as="h1" className="max-w-4xl">
            {title}
          </Heading>
          <p className="text-surface-fg/80 flex items-center gap-2 text-sm md:text-base">
            <MapPin aria-hidden className="size-4 shrink-0" />
            {location}
          </p>
        </Container>
      </section>

      <Container className="grid gap-10 py-12 md:py-16 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
        <div className="flex flex-col gap-8">
          <div>
            {L.about && <Eyebrow>{L.about}</Eyebrow>}
            <p className="mt-4 text-lg leading-relaxed whitespace-pre-line">
              {description}
            </p>
          </div>

          <dl className="border-surface-rule bg-surface-rule grid gap-px overflow-hidden rounded-[10px] border sm:grid-cols-2">
            <Detail
              icon={<CalendarDays className="size-4" />}
              label={L.dateLabel}
            >
              {dateLabel}
            </Detail>
            <Detail
              icon={<MapPin className="size-4" />}
              label={L.locationLabel}
            >
              {location}
            </Detail>
            <Detail icon={<Globe2 className="size-4" />} label={L.formatLabel}>
              {format}
            </Detail>
            <Detail icon={<Users className="size-4" />} label={L.spacesLabel}>
              {spacesLabel}
            </Detail>
          </dl>

          {!ended && (
            <a
              href={calendarHref}
              target="_blank"
              rel="noopener noreferrer"
              className="dx-link inline-flex items-center gap-2 self-start text-sm font-bold"
            >
              <CalendarPlus aria-hidden className="size-4" />
              {L.calendar}
            </a>
          )}
        </div>

        <div
          id="register"
          className="scroll-mt-28 lg:sticky lg:top-28 lg:self-start"
        >
          {ended ? (
            <div
              data-surface="ice"
              className="bg-surface text-surface-fg flex flex-col gap-4 rounded-[10px] p-6 md:p-8"
            >
              <p className="text-h3">{L.endedTitle}</p>
              <p className="text-surface-muted text-sm leading-relaxed">
                {L.endedBody}
              </p>
              <Button href="/events" arrow className="self-start">
                {L.endedButton}
              </Button>
            </div>
          ) : (
            registration
          )}
        </div>
      </Container>
    </main>
  );
}

function Detail({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-canvas p-5">
      <dt className="text-surface-muted flex items-center gap-2 text-xs">
        <span aria-hidden className="text-brand">
          {icon}
        </span>
        {label}
      </dt>
      <dd className="mt-1.5 text-sm font-bold">{children}</dd>
    </div>
  );
}

/** Google Calendar "add event" link (2-hour slot). */
export function googleCalendarHref(
  title: string,
  details: string,
  location: string,
  start: Date,
) {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");
  const end = new Date(start.getTime() + 2 * 3600_000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details: details.slice(0, 500),
    location,
    dates: `${fmt(start)}/${fmt(end)}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
