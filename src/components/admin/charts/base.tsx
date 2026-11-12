"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { fmt } from "./palette";

export * from "./palette";

/** Width of an element, kept up to date (charts draw at real pixels). */
export function useWidth<T extends Element>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new globalThis.ResizeObserver(([e]) =>
      setWidth(e.contentRect.width),
    );
    ro.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Clean axis maximum and ticks (0 … max in 4 steps). */
export function niceScale(max: number, steps = 4) {
  if (max <= 0)
    return { max: steps, ticks: [0, 1, 2, 3, 4].slice(0, steps + 1) };
  const raw = max / steps;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const niceStep = Math.max(1, Math.ceil(step));
  const top = niceStep * steps;
  return {
    max: top,
    ticks: Array.from({ length: steps + 1 }, (_, i) => i * niceStep),
  };
}

/** A floating readout that follows the pointer inside a chart. */
export function Tooltip({
  x,
  y,
  width,
  children,
}: {
  x: number;
  y: number;
  width: number;
  children: React.ReactNode;
}) {
  const flip = x > width - 180;
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 min-w-36 rounded-[10px] bg-white px-3 py-2 text-xs shadow-[0_12px_30px_-12px_rgb(0_8_107/0.35)] ring-1 ring-black/[0.08]"
      style={{
        left: flip ? undefined : x + 14,
        right: flip ? width - x + 14 : undefined,
        top: Math.max(0, y - 12),
      }}
    >
      {children}
    </div>
  );
}

export function TipRow({
  color,
  label,
  value,
  line = false,
}: {
  color?: string;
  label: string;
  value: string;
  line?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      {color && (
        <span
          aria-hidden
          className={cn(
            "shrink-0",
            line ? "h-0.5 w-3 rounded-full" : "size-2 rounded-[2px]",
          )}
          style={{ background: color }}
        />
      )}
      <span className="font-bold tabular-nums">{value}</span>
      <span className="text-surface-muted">{label}</span>
    </div>
  );
}

export function Legend({
  items,
  line = false,
}: {
  items: { label: string; color: string }[];
  line?: boolean;
}) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className={
              line ? "h-0.5 w-3.5 rounded-full" : "size-2.5 rounded-[3px]"
            }
            style={{ background: i.color }}
          />
          <span className="text-surface-muted">{i.label}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * A chart's card: title, what it shows, an optional legend, the chart, and
 * the same numbers as a table (for screen readers and exact values).
 */
export function ChartCard({
  title,
  description,
  legend,
  table,
  children,
  className,
  empty,
}: {
  title: string;
  description?: React.ReactNode;
  legend?: React.ReactNode;
  table?: { head: string[]; rows: (string | number)[][] };
  children: React.ReactNode;
  className?: string;
  /** Shown instead of the chart when there's nothing to plot. */
  empty?: string | false;
}) {
  const [showTable, setShowTable] = useState(false);
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col gap-4 rounded-[10px] bg-white p-5 ring-1 ring-black/[0.06] md:p-6",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="font-bold">{title}</h3>
          {description && (
            <p className="text-surface-muted text-sm leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {table && !empty && (
          <button
            type="button"
            onClick={() => setShowTable((s) => !s)}
            aria-pressed={showTable}
            className="text-royal hover:bg-ice shrink-0 rounded-full px-3 py-1 text-xs font-bold"
          >
            {showTable ? "Show chart" : "Show table"}
          </button>
        )}
      </div>
      {legend && !empty && !showTable && legend}
      {empty ? (
        <p className="text-surface-muted bg-canvas rounded-[8px] px-4 py-8 text-center text-sm">
          {empty}
        </p>
      ) : showTable && table ? (
        <div className="max-h-80 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-surface-rule border-b text-left">
                {table.head.map((h, i) => (
                  <th
                    key={h}
                    className={cn("py-2 pr-3 font-bold", i > 0 && "text-right")}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, i) => (
                <tr
                  key={i}
                  className="border-surface-rule border-b last:border-0"
                >
                  {r.map((c, j) => (
                    <td
                      key={j}
                      className={cn(
                        "py-1.5 pr-3",
                        j > 0 && "text-right tabular-nums",
                      )}
                    >
                      {typeof c === "number" ? fmt(c) : c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
    </section>
  );
}
