import type { Metadata } from "next";
import { AccentText } from "@/components/site/accent-text";
import { ClosingCta } from "@/components/site/closing-cta";
import { Container } from "@/components/site/container";
import { Eyebrow } from "@/components/site/eyebrow";
import {
  EventsBoard,
  type EventFilter,
} from "@/components/site/events/events-board";
import { Heading } from "@/components/site/heading";
import { getEvents } from "@/lib/site/events-data";
import { getWhatsAppHref } from "@/lib/site/page-context";
import { STOCK, stock } from "@/lib/site/stock-media";

export const metadata: Metadata = {
  alternates: { canonical: "/events" },
  title: "Events",
  description:
    "Workshops, meet-ups and open days from Dexta Synergy Services. See what's coming up and register.",
};

const FILTERS: EventFilter[] = [
  "all",
  "upcoming",
  "past",
  "in-person",
  "online",
];

type Search = Record<string, string | string[] | undefined>;

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const [search, events, whatsappHref] = await Promise.all([
    searchParams,
    getEvents(),
    getWhatsAppHref("Hello Dexta, I'd like to know about your events."),
  ]);
  const raw = Array.isArray(search.filter) ? search.filter[0] : search.filter;
  const initialFilter = FILTERS.includes(raw as EventFilter)
    ? (raw as EventFilter)
    : "all";

  return (
    <main className="dx-site">
      <section className="bg-canvas pt-12 pb-12 md:pt-16 md:pb-16">
        <Container className="flex max-w-3xl flex-col items-center gap-5 text-center">
          <Eyebrow>Learn with us</Eyebrow>
          <Heading size="display" as="h1">
            <AccentText text="Events & *meet-ups*" />
          </Heading>
          <p className="text-lead text-surface-muted max-w-2xl">
            Workshops, open days and community meet-ups for founders, creatives
            and builders. See what&apos;s coming up and save your seat.
          </p>
        </Container>
      </section>

      <EventsBoard
        events={events}
        serverNow={Date.now()}
        initialFilter={initialFilter}
      />

      <ClosingCta
        title="Want to host an event *with us*?"
        body="We design, brand and print for events of every size, and we love partnering on community meet-ups."
        image={stock(STOCK.confettiConcert, 2000)}
        whatsappHref={whatsappHref}
      />
    </main>
  );
}
