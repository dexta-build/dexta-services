import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaAsset } from "../media-asset";
import { stock, STOCK } from "@/lib/site/stock-media";
import type { EventSummary } from "@/lib/site/events-data";

export function eventHref(e: Pick<EventSummary, "slug">) {
  return `/events/${e.slug}`;
}

export function eventImage(e: Pick<EventSummary, "image">) {
  return e.image ?? stock(STOCK.eventStage, 1600, 1000);
}

/** "Dec 2nd, 2026" style pill, like Superside's event tiles. */
export function shortDate(iso: string, timeZone = "Africa/Lagos") {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      timeZone,
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

/**
 * Grid card: image with a date pill, the format (IN PERSON / ONLINE), the
 * title and a short description.
 */
export function EventCard({
  event,
  past,
  endedLabel = "Ended",
}: {
  event: EventSummary;
  past: boolean;
  endedLabel?: string;
}) {
  return (
    <Link
      href={eventHref(event)}
      data-cursor={past ? "View" : "Register"}
      className="group flex flex-col gap-4"
    >
      <span className="bg-surface-fg/5 relative block aspect-[16/10] overflow-hidden rounded-[10px]">
        <span
          className={cn(
            "absolute inset-0 transition-transform duration-700 ease-(--ease-out-expo) group-hover:scale-105",
            past && "grayscale-[35%]",
          )}
        >
          <MediaAsset
            media={{ kind: "image", src: eventImage(event), alt: "" }}
            sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
          />
        </span>
        <span
          className={cn(
            "absolute bottom-3 left-3 rounded-full px-3 py-1 text-xs font-bold",
            past ? "bg-charcoal/80 text-white" : "bg-brand-cyan text-royal",
          )}
        >
          {past ? `${endedLabel} · ` : ""}
          {shortDate(event.dateTime, event.timezone)}
        </span>
        {event.sample && (
          <span className="bg-royal/75 text-ice absolute top-3 right-3 rounded-full px-2.5 py-1 text-[0.6875rem] font-bold">
            Sample
          </span>
        )}
      </span>
      <span className="flex flex-col gap-2">
        <span className="text-surface-muted text-[0.6875rem] font-bold tracking-[0.08em] uppercase">
          {event.format} · {event.price}
          {event.closed && !past && " · Registration closed"}
        </span>
        <span className="group-hover:text-brand flex items-start justify-between gap-3 text-lg leading-snug font-bold transition-colors md:text-xl">
          {event.title}
          <ArrowUpRight
            aria-hidden
            className="mt-1 size-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </span>
        <span className="text-surface-muted line-clamp-2 text-sm leading-relaxed">
          {event.description}
        </span>
      </span>
    </Link>
  );
}
