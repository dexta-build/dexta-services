"use client";

import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "../container";
import { Eyebrow } from "../eyebrow";
import { Heading } from "../heading";
import { Section, type Surface } from "../section";
import { Countdown, useNow } from "../offers/countdown";
import { formatMoney } from "@/lib/site/currency";
import { isOfferLive, type OfferData } from "@/lib/site/offers-shared";

const PASTELS: Surface[] = ["ice", "mint", "lilac", "gold", "coral", "stone"];

/**
 * Limited-time offers on the homepage, each with a live countdown. Only
 * offers with an end date appear; the band hides itself when none are
 * running (including when the last countdown reaches zero).
 */
export function OffersBand({
  offers,
  serverNow,
}: {
  /** Offers with an end date, soonest first. */
  offers: OfferData[];
  serverNow: number;
}) {
  const now = useNow() ?? serverNow;
  const live = offers
    .filter((o) => o.endsAt && isOfferLive(o, now))
    .sort((a, b) => Date.parse(a.endsAt!) - Date.parse(b.endsAt!))
    .slice(0, 3);
  if (live.length === 0) return null;

  return (
    <Section surface="royal" spacing="sm">
      <Container>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-3">
            <Eyebrow>Limited-time offers</Eyebrow>
            <Heading size="h2">
              Special offers, <em>while they last</em>
            </Heading>
          </div>
          <Link
            href="/offers"
            className="dx-link self-start text-sm font-bold md:self-auto"
          >
            See all offers
          </Link>
        </div>
        <div
          className={cn(
            "dx-no-scrollbar -mx-4 mt-8 flex snap-x gap-4 overflow-x-auto px-4 md:mx-0 md:grid md:px-0",
            live.length === 1 && "md:grid-cols-1 md:max-w-xl",
            live.length === 2 && "md:grid-cols-2",
            live.length === 3 && "md:grid-cols-3",
          )}
        >
          {live.map((offer, i) => {
            return (
              <Link
                key={offer.id}
                href="/offers#offers"
                data-surface={PASTELS[i % PASTELS.length]}
                className="group bg-surface text-surface-fg flex w-[82%] shrink-0 snap-start flex-col gap-4 rounded-[10px] p-6 md:w-auto"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="border-surface-fg/25 truncate rounded-full border px-2.5 py-1 text-[0.6875rem] font-bold tracking-[0.06em] uppercase">
                    {offer.badge ?? "Offer"}
                  </span>
                  <span className="bg-surface-fg/8 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold">
                    <Clock aria-hidden className="size-3.5" />
                    <Countdown endsAt={offer.endsAt!} compact />
                  </span>
                </span>
                <span className="text-h3">{offer.name}</span>
                <span className="text-surface-muted line-clamp-2 text-sm leading-relaxed">
                  {offer.description}
                </span>
                <span className="mt-auto flex items-end justify-between gap-3 pt-2">
                  <span className="text-2xl font-bold tabular-nums">
                    {offer.priceNGN != null
                      ? formatMoney(offer.priceNGN, "NGN")
                      : "Custom quote"}
                    {offer.priceNGN != null && offer.priceNote && (
                      <span className="text-surface-muted ml-1.5 text-sm font-normal">
                        {offer.priceNote}
                      </span>
                    )}
                  </span>
                  <ArrowUpRight
                    aria-hidden
                    className="mb-1 size-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </span>
              </Link>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
