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
import { EVENTS_PAGE } from "@/lib/content/pages/main";
import { pageMetadata } from "@/lib/content/seo";
import { getWhatsApp } from "@/lib/content/site-settings";
import { loadPage } from "@/lib/content/store";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(EVENTS_PAGE);
}

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
    getWhatsApp("events"),
  ]);
  const { data: c, hidden } = await loadPage(EVENTS_PAGE);
  const raw = Array.isArray(search.filter) ? search.filter[0] : search.filter;
  const initialFilter = FILTERS.includes(raw as EventFilter)
    ? (raw as EventFilter)
    : "all";

  return (
    <main className="dx-site">
      <section className="bg-canvas pt-12 pb-12 md:pt-16 md:pb-16">
        <Container className="flex max-w-3xl flex-col items-center gap-5 text-center">
          {c.hero.eyebrow && <Eyebrow>{c.hero.eyebrow}</Eyebrow>}
          <Heading size="display" as="h1">
            <AccentText text={c.hero.title} />
          </Heading>
          <p className="text-lead text-surface-muted max-w-2xl">
            {c.hero.body}
          </p>
        </Container>
      </section>

      <EventsBoard
        events={events}
        serverNow={Date.now()}
        initialFilter={initialFilter}
        labels={c.board}
      />

      {!hidden.closing && (
        <ClosingCta content={c.closing} whatsappHref={whatsappHref} />
      )}
    </main>
  );
}
