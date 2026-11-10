import "server-only";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { imageUrl } from "./media";
import { STOCK, stock } from "./stock-media";

/**
 * Public events from the existing Event table (published and closed).
 * Cached until the admin saves an event; whether an event is upcoming is
 * worked out at view time, so nothing polls the database.
 */

export const EVENTS_TAG = "events-content";

export type EventFormat = "In person" | "Online";

export type EventSummary = {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string | null;
  /** ISO date/time. */
  dateTime: string;
  timezone: string;
  location: string;
  format: EventFormat;
  closed: boolean;
  /** Development-only sample (preview page, nothing is sent). */
  sample?: boolean;
};

const ONLINE =
  /\b(online|virtual|zoom|google meet|meet\.google|webinar|livestream|live stream|youtube|teams|twitter space|x space)\b/i;

export function formatFor(location: string): EventFormat {
  return ONLINE.test(location) ? "Online" : "In person";
}

function samples(): EventSummary[] {
  const day = 86_400_000;
  const now = Date.now();
  const base = { timezone: "Africa/Lagos", closed: false, sample: true };
  return [
    {
      ...base,
      id: "sample-brand-clinic",
      slug: "sample-brand-clinic",
      title: "Brand Clinic: fix your brand in a day",
      description:
        "Bring your logo, flyers and website. Our designers review them live and give you practical fixes you can use the same week.",
      image: stock(STOCK.teamWhiteboard, 1600, 1000),
      dateTime: new Date(now + 9 * day).toISOString(),
      location: "Dexta Studios, Port Harcourt",
      format: "In person",
    },
    {
      ...base,
      id: "sample-build-live",
      slug: "sample-build-live",
      title: "Build Live: from idea to website in 60 minutes",
      description:
        "Watch our developers plan, design and launch a small business website from scratch, and ask questions as we go.",
      image: stock(STOCK.codeOnLaptop, 1600, 1000),
      dateTime: new Date(now + 23 * day).toISOString(),
      location: "Online · YouTube Live",
      format: "Online",
    },
    {
      ...base,
      id: "sample-print-open-day",
      slug: "sample-print-open-day",
      title: "Print Open Day: papers, foils and finishes",
      description:
        "Touch and compare our paper stocks, foils and finishes before your next wedding, event or corporate print run.",
      image: stock(STOCK.goldRibbons, 1600, 1000),
      dateTime: new Date(now + 40 * day).toISOString(),
      location: "Dexta Studios, Port Harcourt",
      format: "In person",
    },
  ];
}

async function readEvents(): Promise<EventSummary[]> {
  let events: EventSummary[] = [];
  try {
    const rows = await prisma.event.findMany({
      where: { status: { in: ["PUBLISHED", "CLOSED"] } },
      orderBy: { dateTime: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        dateTime: true,
        timezone: true,
        location: true,
        imagePublicId: true,
        status: true,
      },
    });
    events = rows.map((e) => ({
      id: e.id,
      slug: e.slug,
      title: e.title,
      description: e.description,
      image: e.imagePublicId ? imageUrl(e.imagePublicId, 1600, 1000) : null,
      dateTime: e.dateTime.toISOString(),
      timezone: e.timezone,
      location: e.location,
      format: formatFor(e.location),
      closed: e.status === "CLOSED",
    }));
  } catch {
    events = [];
  }
  // Development preview: add sample upcoming events when there are none.
  if (
    process.env.NODE_ENV !== "production" &&
    !events.some((e) => Date.parse(e.dateTime) > Date.now())
  ) {
    events = [...samples(), ...events];
  }
  return events;
}

const readEventsCached = unstable_cache(readEvents, ["site-events"], {
  revalidate: false,
  tags: [EVENTS_TAG],
});

export async function getEvents(): Promise<EventSummary[]> {
  return process.env.NODE_ENV === "development"
    ? readEvents()
    : readEventsCached();
}

/** "Sat, 28 Mar 2026 · 11:30" in the event's own time zone. */
export function eventDateLabel(e: Pick<EventSummary, "dateTime" | "timezone">) {
  const d = new Date(e.dateTime);
  const opts = { timeZone: e.timezone || "Africa/Lagos" } as const;
  try {
    const date = d.toLocaleDateString("en-GB", {
      ...opts,
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("en-GB", {
      ...opts,
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${date} · ${time}`;
  } catch {
    return d.toUTCString();
  }
}
