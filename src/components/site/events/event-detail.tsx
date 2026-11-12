import Link from "next/link";
import {
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  Globe2,
  MapPin,
  Ticket,
  Users,
} from "lucide-react";
import { Button } from "../button";
import { Container } from "../container";
import { Eyebrow } from "../eyebrow";
import { Heading } from "../heading";
import { EventPoster } from "./event-poster";
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
  /** The image whole (not cropped): photo, poster or flyer. */
  image: string;
  /** "Free" or e.g. "₦25,000". */
  price: string;
  priceNote?: string;
  /** Paid events: where people pay after registering. */
  paymentLink?: string;
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
  price,
  priceNote,
  paymentLink,
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
        className="bg-surface text-surface-fg relative isolate overflow-hidden"
      >
        {/* A soft, blurred copy of the image behind everything */}
        <span aria-hidden className="absolute inset-0 -z-20">
          {/* eslint-disable-next-line @next/next/no-img-element -- decorative backdrop */}
          <img
            src={image}
            alt=""
            className="size-full scale-110 object-cover opacity-40 blur-2xl"
          />
        </span>
        <span
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-[#00042f]/70 via-[#00042f]/80 to-[#00042f]/95"
        />
        <Container className="grid gap-10 pt-28 pb-12 md:pt-32 md:pb-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-14">
          <div className="flex min-w-0 flex-col gap-5">
            <nav aria-label="Breadcrumb">
              <ol className="text-surface-fg/75 flex items-center gap-1 text-sm">
                <li>
                  <Link
                    href="/events"
                    className="dx-link hover:text-surface-fg"
                  >
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
              <span className="border-surface-fg/40 rounded-full border px-3 py-1 text-xs font-bold">
                {price}
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
            <ul className="text-surface-fg/85 flex flex-col gap-2 text-sm md:text-base">
              <li className="flex items-center gap-2">
                <CalendarDays aria-hidden className="size-4 shrink-0" />
                {dateLabel}
              </li>
              <li className="flex items-center gap-2">
                <MapPin aria-hidden className="size-4 shrink-0" />
                {location}
              </li>
            </ul>
            {!ended && (
              <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Button href="#register" size="lg" arrow block="mobile">
                  {price === "Free" ? "Register free" : `Register · ${price}`}
                </Button>
                <Button
                  href={calendarHref}
                  external
                  size="lg"
                  variant="outline"
                  block="mobile"
                >
                  <CalendarPlus aria-hidden className="size-4" />
                  {L.calendar}
                </Button>
              </div>
            )}
          </div>
          <div className="mx-auto w-full max-w-md lg:max-w-none">
            <EventPoster src={image} title={title} />
          </div>
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
            <Detail
              icon={<Ticket className="size-4" />}
              label="Entry"
              className="sm:col-span-2"
            >
              {price}
              {priceNote && (
                <span className="text-surface-muted mt-0.5 block text-xs font-normal">
                  {priceNote}
                </span>
              )}
            </Detail>
          </dl>
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
            <div className="flex flex-col gap-4">
              {paymentLink && (
                <div
                  data-surface="ice"
                  className="bg-surface text-surface-fg flex items-start gap-3 rounded-[10px] p-5"
                >
                  <Ticket aria-hidden className="mt-0.5 size-5 shrink-0" />
                  <p className="text-sm leading-relaxed">
                    <strong>This is a paid event ({price}).</strong> Register
                    below, then pay with the link we show you; your seat is
                    confirmed once payment is received.
                  </p>
                </div>
              )}
              {registration}
            </div>
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
  className,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-canvas p-5 ${className ?? ""}`}>
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
