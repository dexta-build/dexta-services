/** "Free", or the price in naira, e.g. "₦25,000". Safe on server and client. */
export function eventPriceLabel(isPaid: boolean, priceNGN: number | null) {
  if (!isPaid || !priceNGN) return "Free";
  return `₦${new Intl.NumberFormat("en-NG").format(priceNGN)}`;
}
