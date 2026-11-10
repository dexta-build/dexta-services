/**
 * Currency helpers shared by server and client. Prices are stored in naira;
 * these convert and format them for the four currencies the site shows.
 */
export const CURRENCIES = ["NGN", "USD", "EUR", "GBP"] as const;
export type Currency = (typeof CURRENCIES)[number];

/** How much 1 naira is worth in each currency. */
export type Rates = Record<Currency, number>;

/**
 * Used if the live rates can't be fetched. Snapshot from open.er-api.com
 * (10 Nov 2026); the live rates replace these automatically.
 */
export const FALLBACK_RATES: Rates = {
  NGN: 1,
  USD: 0.000741,
  EUR: 0.000667,
  GBP: 0.000557,
};

export const CURRENCY_LABEL: Record<Currency, string> = {
  NGN: "Naira",
  USD: "US dollars",
  EUR: "Euros",
  GBP: "Pounds",
};

export function convert(amountNgn: number, rates: Rates, to: Currency) {
  return amountNgn * (rates[to] ?? FALLBACK_RATES[to]);
}

/** "₦1,800", "$1.33", "€24", "£1,120". Small foreign amounts keep pence/cents. */
export function formatMoney(amount: number, currency: Currency) {
  const decimals = currency === "NGN" || amount >= 100 ? 0 : 2;
  return new Intl.NumberFormat(currency === "NGN" ? "en-NG" : "en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export function formatFromNgn(amountNgn: number, rates: Rates, to: Currency) {
  return formatMoney(convert(amountNgn, rates, to), to);
}
