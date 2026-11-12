/** Offer types and helpers shared by server and client code. */

export type OfferData = {
  id: string;
  name: string;
  description: string;
  features: string[];
  /** Whole naira; null shows "Custom quote". */
  priceNGN: number | null;
  /** e.g. "/ month", "one-off", "per project". */
  priceNote: string | null;
  /** Free-text label, e.g. "Bundle", "Best value", "15% off". */
  badge: string | null;
  paymentLink: string | null;
  whatsappEnabled: boolean;
  /** ISO strings; null = no limit. */
  startsAt: string | null;
  endsAt: string | null;
  highlighted: boolean;
};

/** True while an offer is running at `now` (ms). */
export function isOfferLive(
  offer: Pick<OfferData, "startsAt" | "endsAt">,
  now: number,
) {
  return (
    (!offer.startsAt || Date.parse(offer.startsAt) <= now) &&
    (!offer.endsAt || Date.parse(offer.endsAt) > now)
  );
}

/** Offers that haven't ended by `now` (ones that start later included). */
export function notEnded(offers: OfferData[], now: number) {
  return offers.filter((o) => !o.endsAt || Date.parse(o.endsAt) > now);
}
