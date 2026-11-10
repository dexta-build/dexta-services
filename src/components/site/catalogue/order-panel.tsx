"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../button";
import { useCurrency } from "./currency";
import { CURRENCIES } from "@/lib/site/currency";
import type { CatalogueItemData } from "@/lib/site/catalogue-data";

/** Adds a pre-filled message to the site's WhatsApp link. */
export function whatsAppWithText(base: string, text: string) {
  try {
    const url = new URL(base);
    url.searchParams.delete("text");
    // encodeURIComponent (%20) rather than searchParams (+): WhatsApp
    // doesn't always turn "+" back into spaces.
    const sep = url.search ? "&" : "?";
    return `${url.toString()}${sep}text=${encodeURIComponent(text)}`;
  } catch {
    return base;
  }
}

/**
 * Price, MOQ, quantity and "Order on WhatsApp" for one catalogue item.
 * The quantity can never go below the item's minimum order quantity.
 */
export function OrderPanel({
  item,
  catalogueTitle,
  itemUrl,
  whatsappBase,
}: {
  item: CatalogueItemData;
  catalogueTitle: string;
  /** Absolute link to this item, included in the WhatsApp message. */
  itemUrl: string;
  whatsappBase: string | null;
}) {
  const { currency, format, formatIn } = useCurrency();
  const [qty, setQty] = useState(item.moq);
  const [draft, setDraft] = useState(String(item.moq));

  const commit = (value: number) => {
    const next = Math.max(
      item.moq,
      Number.isFinite(value) ? Math.round(value) : item.moq,
    );
    setQty(next);
    setDraft(String(next));
  };

  const total = item.price * qty;
  const others = CURRENCIES.filter((c) => c !== currency);

  const message = [
    "Hello Dexta! I'd like to order:",
    "",
    `• ${item.title} (${catalogueTitle} · ${item.category})`,
    `• Quantity: ${qty} × ${item.unit}`,
    `• Price: ${formatIn(item.price, "NGN")} per ${item.unit}`,
    `• Total: ${formatIn(total, "NGN")}${currency !== "NGN" ? ` (about ${format(total)})` : ""}`,
    "",
    itemUrl,
  ].join("\n");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-eyebrow text-surface-muted">
          {catalogueTitle} · {item.category}
        </p>
        <h2 className="mt-2 text-xl font-bold md:text-2xl">{item.title}</h2>
        {item.description && (
          <p className="text-surface-muted mt-2 text-sm leading-relaxed">
            {item.description}
          </p>
        )}
      </div>

      <div>
        <p className="text-3xl font-bold tabular-nums">
          {format(item.price)}
          <span className="text-surface-muted text-sm font-normal">
            {" "}
            / {item.unit}
          </span>
        </p>
        <p className="text-surface-muted mt-1 text-xs tabular-nums">
          ≈ {others.map((c) => formatIn(item.price, c)).join(" · ")}
        </p>
      </div>

      <dl className="border-surface-rule grid grid-cols-2 gap-y-2 border-t pt-4 text-sm">
        <dt className="text-surface-muted">Minimum order</dt>
        <dd className="text-right font-bold">
          {item.moq} × {item.unit}
        </dd>
        {item.tags.length > 0 && (
          <>
            <dt className="text-surface-muted">Details</dt>
            <dd className="text-right">{item.tags.join(", ")}</dd>
          </>
        )}
      </dl>

      <div className="flex flex-col gap-2">
        <label htmlFor={`qty-${item.id}`} className="text-sm font-bold">
          Quantity
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={qty <= item.moq}
            onClick={() => commit(qty - 1)}
            className="border-surface-fg/30 inline-flex size-11 items-center justify-center rounded-full border transition-colors disabled:opacity-35"
          >
            <Minus className="size-4" />
          </button>
          <input
            id={`qty-${item.id}`}
            type="number"
            inputMode="numeric"
            min={item.moq}
            step={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => commit(Number(draft))}
            onKeyDown={(e) => e.key === "Enter" && commit(Number(draft))}
            className="border-surface-fg/30 h-11 w-24 rounded-full border bg-transparent text-center font-bold tabular-nums outline-none focus-visible:border-brand-cyan"
          />
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => commit(qty + 1)}
            className="border-surface-fg/30 inline-flex size-11 items-center justify-center rounded-full border transition-colors"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <p
          className={cn(
            "text-surface-muted text-xs",
            Number(draft) < item.moq && "text-coral",
          )}
        >
          Minimum {item.moq}.{" "}
          {Number(draft) < item.moq && "We'll round up to the minimum."}
        </p>
      </div>

      <div className="border-surface-rule flex items-baseline justify-between border-t pt-4">
        <span className="text-sm">Estimated total</span>
        <span className="text-xl font-bold tabular-nums">{format(total)}</span>
      </div>

      {whatsappBase ? (
        <Button
          href={whatsAppWithText(whatsappBase, message)}
          external
          block
          arrow
          size="lg"
        >
          Order on WhatsApp
        </Button>
      ) : (
        <Button href="/contact" block arrow size="lg">
          Request this item
        </Button>
      )}
      <p className="text-surface-muted text-center text-xs">
        Prices are estimates. We confirm the final price before production.
      </p>
    </div>
  );
}
