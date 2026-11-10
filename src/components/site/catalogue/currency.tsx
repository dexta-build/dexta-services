"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  CURRENCIES,
  CURRENCY_LABEL,
  formatFromNgn,
  type Currency,
  type Rates,
} from "@/lib/site/currency";

const STORAGE_KEY = "dexta-currency";

type CurrencyContextValue = {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  rates: Rates;
  /** Format a naira amount in the chosen currency. */
  format: (amountNgn: number) => string;
  /** Format a naira amount in a specific currency. */
  formatIn: (amountNgn: number, currency: Currency) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

/**
 * Holds the visitor's chosen currency (remembered on this device) and the
 * current rates. Naira is the default and is used until the saved choice
 * loads, so server and browser render the same thing.
 */
export function CurrencyProvider({
  rates,
  children,
}: {
  rates: Rates;
  children: React.ReactNode;
}) {
  const [currency, setCurrencyState] = useState<Currency>("NGN");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as Currency | null;
      if (saved && CURRENCIES.includes(saved)) setCurrencyState(saved);
    } catch {
      // Storage blocked (private mode etc.): stay on naira.
    }
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    try {
      window.localStorage.setItem(STORAGE_KEY, c);
    } catch {
      // Not remembered, but still works for this visit.
    }
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        rates,
        format: (n) => formatFromNgn(n, rates, currency),
        formatIn: (n, c) => formatFromNgn(n, rates, c),
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside CurrencyProvider");
  return ctx;
}

/** A naira amount shown in the visitor's chosen currency. */
export function Price({ ngn, className }: { ngn: number; className?: string }) {
  const { format } = useCurrency();
  return <span className={cn("tabular-nums", className)}>{format(ngn)}</span>;
}

/** Segmented NGN / USD / EUR / GBP control. */
export function CurrencySwitcher({ className }: { className?: string }) {
  const { currency, setCurrency } = useCurrency();
  return (
    <div
      role="radiogroup"
      aria-label="Show prices in"
      className={cn(
        "border-surface-fg/20 inline-flex shrink-0 rounded-full border p-1",
        className,
      )}
    >
      {CURRENCIES.map((c) => {
        const active = c === currency;
        return (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={CURRENCY_LABEL[c]}
            onClick={() => setCurrency(c)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
              active
                ? "bg-surface-fg text-surface"
                : "text-surface-muted hover:text-surface-fg",
            )}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}
