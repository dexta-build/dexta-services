"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../button";
import { Container } from "../container";
import { Heading } from "../heading";
import { MediaAsset } from "../media-asset";
import { Countdown, useNow } from "../offers/countdown";
import { EventCard, eventHref, eventImage, shortDate } from "./event-card";
import type { EventSummary } from "@/lib/site/events-data";

const PAGE_SIZE = 9;

export type EventFilter = "all" | "upcoming" | "past" | "in-person" | "online";

const FILTERS: { key: EventFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "in-person", label: "In person" },
  { key: "online", label: "Online" },
];

/**
 * Superside-style events page body: the next two events as large tiles
 * side by side, then "All events" with filter chips, a three-column grid
 * and "Load more". Upcoming/past is worked out in the browser.
 */
export function EventsBoard({
  events,
  serverNow,
  initialFilter,
}: {
  events: EventSummary[];
  serverNow: number;
  initialFilter: EventFilter;
}) {
  const now = useNow() ?? serverNow;
  const [filter, setFilter] = useState<EventFilter>(initialFilter);
  const [shown, setShown] = useState(PAGE_SIZE);

  const isPast = (e: EventSummary) => Date.parse(e.dateTime) <= now;
  const upcoming = events
    .filter((e) => !isPast(e))
    .sort((a, b) => Date.parse(a.dateTime) - Date.parse(b.dateTime));
  const past = events
    .filter(isPast)
    .sort((a, b) => Date.parse(b.dateTime) - Date.parse(a.dateTime));
  const ordered = [...upcoming, ...past];

  const filtered = ordered.filter((e) => {
    if (filter === "upcoming") return !isPast(e);
    if (filter === "past") return isPast(e);
    if (filter === "in-person") return e.format === "In person";
    if (filter === "online") return e.format === "Online";
    return true;
  });
  const featured = upcoming.slice(0, 2);

  useEffect(() => {
    const next = filter === "all" ? "/events" : `/events?filter=${filter}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", next);
    }
  }, [filter]);

  return (
    <>
      {featured.length > 0 ? (
        <div
          className={cn(
            "grid",
            featured.length === 2 ? "md:grid-cols-2" : "grid-cols-1",
          )}
        >
          {featured.map((e, i) => (
            <FeaturedTile
              key={e.id}
              event={e}
              wide={featured.length === 1}
              priority={i === 0}
            />
          ))}
        </div>
      ) : (
        <Container>
          <div
            data-surface="ice"
            className="bg-surface text-surface-fg flex flex-col items-center gap-3 rounded-[10px] px-6 py-12 text-center"
          >
            <CalendarDays aria-hidden className="size-8" />
            <p className="text-h3">No upcoming events right now</p>
            <p className="text-surface-muted max-w-md text-sm leading-relaxed">
              New events are announced here first. Browse past events below or
              follow us on social media to hear about the next one.
            </p>
          </div>
        </Container>
      )}

      <section
        id="all-events"
        className="scroll-mt-24 py-16 md:py-24"
        aria-labelledby="all-events-title"
      >
        <Container>
          <Heading
            size="h2"
            as="h2"
            className="text-center"
            id="all-events-title"
          >
            All events
          </Heading>
          <div
            role="group"
            aria-label="Filter events"
            className="dx-no-scrollbar -mx-4 mt-8 mb-10 flex gap-2 overflow-x-auto px-4 md:mx-0 md:justify-center md:px-0"
          >
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                aria-pressed={filter === f.key}
                onClick={() => {
                  setFilter(f.key);
                  setShown(PAGE_SIZE);
                }}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-sm transition-colors",
                  filter === f.key
                    ? "bg-surface-fg text-surface border-transparent"
                    : "border-surface-fg/20 hover:border-surface-fg",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="text-surface-muted border-surface-rule rounded-[10px] border border-dashed px-6 py-14 text-center">
              No events here yet.
            </p>
          ) : (
            <>
              <div className="grid gap-x-6 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
                {filtered.slice(0, shown).map((e) => (
                  <EventCard key={e.id} event={e} past={isPast(e)} />
                ))}
              </div>
              {filtered.length > shown && (
                <div className="mt-14 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setShown((n) => n + PAGE_SIZE)}
                  >
                    Load more
                  </Button>
                </div>
              )}
            </>
          )}
        </Container>
      </section>
    </>
  );
}

/** Edge-to-edge tile with the title over the image, like Superside's. */
function FeaturedTile({
  event,
  wide,
  priority,
}: {
  event: EventSummary;
  wide: boolean;
  priority: boolean;
}) {
  return (
    <Link
      href={eventHref(event)}
      data-surface="royal"
      data-cursor="Register"
      className={cn(
        "group text-surface-fg relative isolate flex min-h-[26rem] flex-col justify-end overflow-hidden md:min-h-[32rem]",
        wide && "lg:min-h-[36rem]",
      )}
    >
      <span className="absolute inset-0 -z-20 transition-transform duration-700 ease-(--ease-out-expo) group-hover:scale-105">
        <MediaAsset
          media={{ kind: "image", src: eventImage(event), alt: "" }}
          sizes={wide ? "100vw" : "(min-width: 768px) 50vw, 100vw"}
          priority={priority}
        />
      </span>
      <span
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-[#00042f]/95 via-[#00042f]/50 to-transparent"
      />
      <span className="flex flex-col gap-3 p-6 md:p-8 lg:p-10">
        <span className="flex flex-wrap items-center gap-2">
          <span className="bg-brand-cyan text-royal rounded-full px-3 py-1 text-xs font-bold">
            {shortDate(event.dateTime, event.timezone)}
          </span>
          <span className="border-surface-fg/40 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold">
            <Clock aria-hidden className="size-3.5" />
            Starts in <Countdown endsAt={event.dateTime} compact />
          </span>
          {event.sample && (
            <span className="bg-surface-fg/15 rounded-full px-2.5 py-1 text-[0.6875rem] font-bold">
              Sample
            </span>
          )}
        </span>
        <span className="text-h2 flex max-w-2xl items-start gap-2 leading-tight">
          {event.title}
          <ArrowUpRight
            aria-hidden
            className="mt-1.5 size-6 shrink-0 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
          />
        </span>
        <span className="text-surface-fg/80 line-clamp-2 max-w-2xl text-sm leading-relaxed md:text-[0.9375rem]">
          {event.description}
        </span>
        <span className="text-surface-fg/70 text-xs font-bold tracking-[0.08em] uppercase">
          {event.location.toLowerCase().startsWith(event.format.toLowerCase())
            ? event.location
            : `${event.format} · ${event.location}`}
        </span>
      </span>
    </Link>
  );
}
