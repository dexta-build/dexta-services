import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCENT, STATUS, fmt } from "./palette";

function Sparkline({ values }: { values: number[] }) {
  const w = 96;
  const h = 28;
  const max = Math.max(1, ...values);
  const n = values.length;
  if (n < 2) return null;
  const pts = values.map(
    (v, i) =>
      [(i / (n - 1)) * (w - 4) + 2, h - 3 - (v / max) * (h - 6)] as const,
  );
  const d = pts
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join("");
  const [lx, ly] = pts[n - 1];
  return (
    <svg width={w} height={h} aria-hidden className="shrink-0">
      <path d={`${d}L${w - 2},${h}L2,${h}Z`} fill={ACCENT} opacity={0.1} />
      <path
        d={d}
        fill="none"
        stroke="#a9aba7"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <circle
        cx={lx}
        cy={ly}
        r={3}
        fill={ACCENT}
        stroke="#fff"
        strokeWidth={1.5}
      />
    </svg>
  );
}

/**
 * A headline number with its change vs the previous period (arrow + word,
 * never colour alone) and a small trend line.
 */
export function StatTile({
  label,
  value,
  delta,
  upIsGood,
  trend,
  href,
  periodLabel,
}: {
  label: string;
  value: number;
  delta: number | null;
  upIsGood: boolean;
  trend: number[];
  href?: string;
  periodLabel: string;
}) {
  const good = delta !== null && delta !== 0 && delta > 0 === upIsGood;
  const Icon =
    delta === null || delta === 0
      ? Minus
      : delta > 0
        ? ArrowUpRight
        : ArrowDownRight;
  const deltaText =
    delta === null
      ? `none in ${periodLabel}`
      : delta === 0
        ? "same as before"
        : `${delta > 0 ? "+" : ""}${delta}% vs ${periodLabel}`;
  const body = (
    <>
      <span className="text-surface-muted text-sm">{label}</span>
      <span className="flex items-end justify-between gap-3">
        <span className="text-[2rem] leading-none font-bold tracking-[-0.02em]">
          {fmt(value)}
        </span>
        <Sparkline values={trend} />
      </span>
      <span className="flex items-center gap-1 text-xs">
        <Icon
          aria-hidden
          className="size-3.5"
          style={{
            color:
              delta === null || delta === 0
                ? "#8a8c88"
                : good
                  ? STATUS.good
                  : STATUS.critical,
          }}
        />
        <span className="text-surface-muted">{deltaText}</span>
      </span>
    </>
  );
  const cls =
    "flex min-w-0 flex-col gap-2 rounded-[10px] bg-white p-5 ring-1 ring-black/[0.06]";
  return href ? (
    <Link
      href={href}
      className={cn(
        cls,
        "transition-shadow hover:shadow-[0_18px_40px_-24px_rgb(0_8_107/0.45)]",
      )}
    >
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
