import "server-only";

import { FALLBACK_RATES, type Rates } from "./currency";

/**
 * Live naira exchange rates from open.er-api.com (free, no key; updates
 * once a day). Cached by Next for 12 hours, so the API is called at most
 * twice a day no matter how many people visit. Falls back to a snapshot
 * if the service is unreachable.
 */
export async function getRates(): Promise<Rates> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/NGN", {
      next: { revalidate: 60 * 60 * 12, tags: ["exchange-rates"] },
    });
    if (!res.ok) return FALLBACK_RATES;
    const data = (await res.json()) as {
      result?: string;
      rates?: Record<string, number>;
    };
    const r = data.rates;
    if (data.result !== "success" || !r?.USD || !r?.EUR || !r?.GBP) {
      return FALLBACK_RATES;
    }
    return { NGN: 1, USD: r.USD, EUR: r.EUR, GBP: r.GBP };
  } catch {
    return FALLBACK_RATES;
  }
}
