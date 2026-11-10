"use client";

import { Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../button";
import type { Surface } from "../section";
import { useNow } from "./countdown";
import { OfferCard } from "./offer-card";
import { isOfferLive, type OfferData } from "@/lib/site/offers-shared";

const PASTELS: Surface[] = ["ice", "mint", "gold", "lilac", "coral", "stone"];

/**
 * Card widths by number of offers. Cards sit in a centred, wrapping row, so
 * a last row that isn't full (e.g. 5 = 3 + 2) is centred, not left-aligned.
 * Four offers make a 2 × 2 grid rather than 3 + 1.
 */
function basisFor(count: number) {
  const half =
    "md:basis-[calc((100%-1rem)/2)] lg:basis-[calc((100%-1.25rem)/2)]";
  if (count === 1) return "md:basis-[36rem]";
  if (count === 2 || count === 4) return `${half} xl:max-w-[38rem]`;
  return `${half} xl:basis-[calc((100%-2.5rem)/3)]`;
}

/**
 * The offer cards. Offers outside their dates are dropped, including the
 * moment a countdown reaches zero; with nothing running, the empty state
 * "No Offer available at this time" shows instead.
 */
export function OffersGrid({
  offers,
  serverNow,
  whatsappBase,
}: {
  offers: OfferData[];
  /** Time the server rendered at, used until the browser clock takes over. */
  serverNow: number;
  whatsappBase: string | null;
}) {
  const now = useNow() ?? serverNow;
  const live = offers.filter((o) => isOfferLive(o, now));

  if (live.length === 0) return <NoOffers whatsappBase={whatsappBase} />;

  return (
    <div className="flex flex-wrap justify-center gap-4 lg:gap-5">
      {live.map((o, i) => (
        <div
          key={o.id}
          className={cn(
            "w-full min-w-0 md:w-auto md:grow-0",
            basisFor(live.length),
          )}
        >
          <OfferCard
            offer={o}
            surface={PASTELS[i % PASTELS.length]}
            whatsappBase={whatsappBase}
          />
        </div>
      ))}
    </div>
  );
}

/** Shown when no offer is running. */
export function NoOffers({ whatsappBase }: { whatsappBase: string | null }) {
  return (
    <div
      data-surface="ice"
      className="bg-surface text-surface-fg flex flex-col items-center gap-5 rounded-[10px] px-6 py-16 text-center md:py-24"
    >
      <span
        aria-hidden
        className="bg-surface-fg/8 inline-flex size-16 items-center justify-center rounded-full"
      >
        <Tag className="size-7" />
      </span>
      <h3 className="dx-heading text-h2 max-w-xl">
        No Offer available at this time
      </h3>
      <p className="text-surface-muted max-w-md leading-relaxed">
        New offers are on the way. In the meantime, browse our catalogues or
        tell us what you need.
      </p>
      <div className="mt-2 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
        <Button href="/catalogue" arrow block="mobile">
          Browse catalogues
        </Button>
        {whatsappBase && (
          <Button href={whatsappBase} external variant="outline" block="mobile">
            Chat on WhatsApp
          </Button>
        )}
      </div>
    </div>
  );
}
