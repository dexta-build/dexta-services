import type { Metadata } from "next";
import { EventCard } from "@/components/events/event-card";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Browse upcoming and past events from Dexta Synergy Services. Register for community events, workshops, and more.",
};

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const now = new Date();

  let events: Array<{
    id: string;
    slug: string;
    title: string;
    description: string;
    dateTime: Date;
    timezone: string;
    location: string;
    imagePublicId: string | null;
    attendeeLimit: number | null;
    status: string;
  }> = [];

  let acceptedCounts: Array<{
    eventId: string;
    _count: { _all: number };
  }> = [];

  try {
    events = await prisma.event.findMany({
      where: { status: { in: ["PUBLISHED", "CLOSED"] } },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        dateTime: true,
        timezone: true,
        location: true,
        imagePublicId: true,
        attendeeLimit: true,
        status: true,
      },
      orderBy: { dateTime: "desc" },
    });

    if (events.length > 0) {
      const counts = await prisma.eventRegistration.groupBy({
        by: ["eventId"],
        where: {
          eventId: { in: events.map((event) => event.id) },
          status: "ACCEPTED",
        },
        _count: { _all: true },
      });
      acceptedCounts = counts;
    }
  } catch (error) {
    console.warn("Could not fetch events from database:", error);
  }

  const acceptedCountByEventId = new Map(
    acceptedCounts.map((entry) => [entry.eventId, entry._count._all]),
  );

  const eventsWithCounts = events.map((event) => ({
    ...event,
    acceptedCount: acceptedCountByEventId.get(event.id) ?? 0,
  }));

  const upcoming = eventsWithCounts
    .filter((e) => e.dateTime >= now && e.status === "PUBLISHED")
    .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

  const past = eventsWithCounts
    .filter((e) => e.dateTime < now || e.status === "CLOSED")
    .sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());

  const hasEvents = upcoming.length > 0 || past.length > 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 pb-20 pt-32 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <p className="mb-2 text-xs font-medium uppercase tracking-[4px] text-cyan-400">
            Events
          </p>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Our Events
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-[#888]">
            Join our community events — connect, learn, and grow with fellow
            developers and creators.
          </p>
        </div>

        {!hasEvents ? (
          <div className="py-20 text-center">
            <p className="text-lg text-[#666]">No events at the moment.</p>
            <p className="mt-2 text-sm text-[#444]">Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Upcoming Events */}
            {upcoming.length > 0 && (
              <section>
                <h2 className="mb-6 flex items-center gap-3 text-lg font-semibold text-white">
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                  Upcoming
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {upcoming.map((event) => (
                    <EventCard
                      key={event.id}
                      slug={event.slug}
                      title={event.title}
                      description={event.description}
                      dateTime={event.dateTime}
                      timezone={event.timezone}
                      location={event.location}
                      imagePublicId={event.imagePublicId}
                      attendeeLimit={event.attendeeLimit}
                      acceptedCount={event.acceptedCount}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Past Events */}
            {past.length > 0 && (
              <section>
                <h2 className="mb-6 flex items-center gap-3 text-lg font-semibold text-[#888]">
                  <span className="h-2 w-2 rounded-full bg-[#444]" />
                  Past Events
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {past.map((event) => (
                    <EventCard
                      key={event.id}
                      slug={event.slug}
                      title={event.title}
                      description={event.description}
                      dateTime={event.dateTime}
                      timezone={event.timezone}
                      location={event.location}
                      imagePublicId={event.imagePublicId}
                      attendeeLimit={event.attendeeLimit}
                      acceptedCount={event.acceptedCount}
                      isPast
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
