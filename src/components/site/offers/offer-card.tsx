"use client";

import { Check, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../button";
import { useCurrency } from "../catalogue/currency";
import { whatsAppWithText } from "../catalogue/order-panel";
import type { Surface } from "../section";
import { Countdown } from "./countdown";
import type { OfferData } from "@/lib/site/offers-shared";

/** Lets long button labels wrap in narrow cards instead of overflowing. */
const WRAP = "h-auto min-h-14 py-3 text-center whitespace-normal";

/**
 * A large pastel offer card in the style of Superside's pricing plans:
 * name, description, price (in the visitor's currency), an optional
 * countdown, what's included, then the payment buttons. Highlighted offers
 * use royal blue.
 */
export function OfferCard({
  offer,
  surface,
  whatsappBase,
}: {
  offer: OfferData;
  surface: Surface;
  whatsappBase: string | null;
}) {
  const { format, formatIn, currency } = useCurrency();
  const hasPrice = offer.priceNGN != null;

  const message = [
    `Hello Dexta! I'm interested in the ${offer.name} offer.`,
    hasPrice
      ? `Price: ${formatIn(offer.priceNGN!, "NGN")}${offer.priceNote ? ` ${offer.priceNote}` : ""}${currency !== "NGN" ? ` (about ${format(offer.priceNGN!)})` : ""}`
      : "Please send me a quote.",
  ].join("\n");
  const whatsappHref =
    offer.whatsappEnabled && whatsappBase
      ? whatsAppWithText(whatsappBase, message)
      : null;

  return (
    <article
      data-surface={offer.highlighted ? "royal" : surface}
      className="bg-surface text-surface-fg flex h-full flex-col rounded-[10px] p-7 md:p-9"
    >
      {offer.badge && (
        <span className="border-surface-fg/25 mb-5 self-start rounded-full border px-3 py-1 text-[0.6875rem] font-bold tracking-[0.06em] uppercase">
          {offer.badge}
        </span>
      )}

      <h3 className="text-h2 leading-tight">{offer.name}</h3>
      <p className="text-surface-fg/80 mt-4 leading-relaxed">
        {offer.description}
      </p>

      <div className="border-surface-rule mt-8 border-t pt-6">
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-[2.5rem] leading-none font-bold tracking-tight tabular-nums md:text-[2.75rem]">
            {hasPrice ? format(offer.priceNGN!) : "Custom quote"}
          </span>
          {hasPrice && offer.priceNote && (
            <span className="text-surface-muted">{offer.priceNote}</span>
          )}
        </p>
        {hasPrice && currency !== "NGN" && (
          <p className="text-surface-muted mt-2 text-xs tabular-nums">
            {formatIn(offer.priceNGN!, "NGN")} · estimate at today&apos;s rate
          </p>
        )}
      </div>

      {offer.endsAt && <Countdown endsAt={offer.endsAt} className="mt-6" />}

      {offer.features.length > 0 && (
        <ul className="mt-8 flex flex-col">
          {offer.features.map((f, i) => (
            <li
              key={`${i}-${f}`}
              className="border-surface-rule flex items-start justify-between gap-4 border-b py-3 text-sm leading-snug first:border-t"
            >
              {f}
              <Check aria-hidden className="mt-0.5 size-4 shrink-0" />
            </li>
          ))}
        </ul>
      )}

      <div className={cn("mt-auto flex flex-col gap-3 pt-8")}>
        {offer.paymentLink && (
          <Button
            href={offer.paymentLink}
            external
            block
            size="lg"
            className={WRAP}
          >
            <CreditCard aria-hidden className="size-4" />
            Pay now
          </Button>
        )}
        {whatsappHref && (
          <Button
            href={whatsappHref}
            external
            block
            size="lg"
            arrow={!offer.paymentLink}
            variant={offer.paymentLink ? "outline" : "primary"}
            className={WRAP}
          >
            {hasPrice ? "Order on WhatsApp" : "Get a quote on WhatsApp"}
          </Button>
        )}
        {!offer.paymentLink && !whatsappHref && (
          <Button href="/contact" block size="lg" arrow className={WRAP}>
            Ask about this offer
          </Button>
        )}
      </div>
    </article>
  );
}
