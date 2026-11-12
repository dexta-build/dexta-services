"use client";

import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  EMPTY_CELL,
  GRID,
  MUTED_TEXT,
  ORDINAL,
  SEQUENTIAL,
  TipRow,
  Tooltip,
  compact,
  fmt,
  niceScale,
  useWidth,
} from "./base";

const AXIS = { left: 32, right: 12, top: 10, bottom: 26 };

/** Show at most ~8 x labels, evenly spaced, always the first and last. */
function labelIndexes(n: number, width: number) {
  const fit = Math.max(2, Math.min(8, Math.floor(width / 70)));
  if (n <= fit) return new Set(Array.from({ length: n }, (_, i) => i));
  const step = (n - 1) / (fit - 1);
  return new Set(Array.from({ length: fit }, (_, i) => Math.round(i * step)));
}

function YGrid({
  ticks,
  y,
  x0,
  x1,
}: {
  ticks: number[];
  y: (v: number) => number;
  x0: number;
  x1: number;
}) {
  return (
    <g>
      {ticks.map((t) => (
        <g key={t}>
          <line
            x1={x0}
            x2={x1}
            y1={y(t)}
            y2={y(t)}
            stroke={GRID}
            strokeWidth={1}
          />
          <text
            x={x0 - 8}
            y={y(t)}
            dy="0.32em"
            textAnchor="end"
            fontSize={11}
            fill={MUTED_TEXT}
            className="tabular-nums"
          >
            {compact(t)}
          </text>
        </g>
      ))}
    </g>
  );
}

/* ─── Line chart: trends over time, one line per series ───────────────── */

export function LineChart({
  labels,
  series,
  height = 240,
}: {
  labels: string[];
  series: { key: string; label: string; color: string; values: number[] }[];
  height?: number;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const n = labels.length;
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const { max: top, ticks } = niceScale(max);
  const ih = height - AXIS.top - AXIS.bottom;
  // Direct end labels only when they won't collide; otherwise the legend
  // and tooltip carry the names (labels are never nudged off their lines).
  const endVals = series.map((s) => s.values[s.values.length - 1] ?? 0);
  const endYs = endVals.map((v) => ih - (v / top) * ih).sort((a, b) => a - b);
  const directLabels =
    series.length <= 3 &&
    endYs.every((v, i) => i === 0 || v - endYs[i - 1] >= 14);
  const iw = Math.max(
    0,
    width - AXIS.left - AXIS.right - (directLabels ? 90 : 0),
  );
  const x = (i: number) => AXIS.left + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v: number) => AXIS.top + ih - (v / top) * ih;
  const shown = labelIndexes(n, iw);

  const onMove = (e: React.PointerEvent<React.ComponentRef<"rect">>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    const i = n <= 1 ? 0 : Math.round((px / r.width) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, i)));
  };

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label="Line chart">
          <YGrid ticks={ticks} y={y} x0={AXIS.left} x1={AXIS.left + iw} />
          {labels.map((l, i) =>
            shown.has(i) ? (
              <text
                key={l + i}
                x={x(i)}
                y={height - 8}
                textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
                fontSize={11}
                fill={MUTED_TEXT}
              >
                {l}
              </text>
            ) : null,
          )}
          {hover !== null && (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={AXIS.top}
              y2={AXIS.top + ih}
              stroke="#c9c9c4"
              strokeWidth={1}
            />
          )}
          {series.map((s) => {
            const d = s.values
              .map(
                (v, i) =>
                  `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`,
              )
              .join("");
            const last = s.values.length - 1;
            return (
              <g key={s.key}>
                <path
                  d={d}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                <circle
                  cx={x(last)}
                  cy={y(s.values[last] ?? 0)}
                  r={4}
                  fill={s.color}
                  stroke="#fff"
                  strokeWidth={2}
                />
                {hover !== null && (
                  <circle
                    cx={x(hover)}
                    cy={y(s.values[hover] ?? 0)}
                    r={4.5}
                    fill={s.color}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                )}
              </g>
            );
          })}
          {directLabels &&
            series.map((s) => (
              <text
                key={s.key}
                x={AXIS.left + iw + 10}
                y={y(s.values[s.values.length - 1] ?? 0)}
                dy="0.32em"
                fontSize={11}
                fill="#202321"
                fontWeight={700}
              >
                {fmt(s.values[s.values.length - 1] ?? 0)}{" "}
                <tspan fill={MUTED_TEXT} fontWeight={400}>
                  {s.label.split(" ")[0]}
                </tspan>
              </text>
            ))}
          <rect
            x={AXIS.left}
            y={AXIS.top}
            width={iw}
            height={ih}
            fill="transparent"
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>
      )}
      {hover !== null && (
        <Tooltip x={x(hover)} y={AXIS.top} width={width}>
          <p className="mb-1 font-bold">{labels[hover]}</p>
          {series.map((s) => (
            <TipRow
              key={s.key}
              line
              color={s.color}
              label={s.label}
              value={fmt(s.values[hover] ?? 0)}
            />
          ))}
        </Tooltip>
      )}
    </div>
  );
}

/* ─── Column chart / histogram: one series ────────────────────────────── */

export function ColumnChart({
  labels,
  values,
  color,
  valueLabel,
  height = 200,
  labelEvery,
}: {
  labels: string[];
  values: number[];
  color: string;
  /** e.g. "enquiries", shown in the tooltip. */
  valueLabel: string;
  height?: number;
  /** Show every nth x label (default: as many as fit). */
  labelEvery?: number;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const n = values.length;
  const { max: top, ticks } = niceScale(Math.max(1, ...values));
  const iw = Math.max(0, width - AXIS.left - AXIS.right);
  const ih = height - AXIS.top - AXIS.bottom;
  const band = n ? iw / n : 0;
  const bw = Math.min(24, Math.max(2, band - 2));
  const y = (v: number) => AXIS.top + ih - (v / top) * ih;
  const shown = labelEvery
    ? new Set(labels.map((_, i) => i).filter((i) => i % labelEvery === 0))
    : labelIndexes(n, iw);
  const peak = values.indexOf(Math.max(...values));

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label="Column chart">
          <YGrid ticks={ticks} y={y} x0={AXIS.left} x1={AXIS.left + iw} />
          {values.map((v, i) => {
            const cx = AXIS.left + band * i + band / 2;
            const h = Math.max(0, AXIS.top + ih - y(v));
            const r = Math.min(4, bw / 2, h);
            const x0 = cx - bw / 2;
            const yTop = AXIS.top + ih - h;
            // 4px rounded data end, square at the baseline.
            const d =
              h > 0
                ? `M${x0},${AXIS.top + ih}V${yTop + r}Q${x0},${yTop} ${x0 + r},${yTop}H${x0 + bw - r}Q${x0 + bw},${yTop} ${x0 + bw},${yTop + r}V${AXIS.top + ih}Z`
                : "";
            return (
              <g key={i}>
                {d && (
                  <path
                    d={d}
                    fill={color}
                    opacity={hover === null || hover === i ? 1 : 0.55}
                  />
                )}
                {i === peak && v > 0 && hover === null && (
                  <text
                    x={cx}
                    y={yTop - 6}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={700}
                    fill="#202321"
                  >
                    {fmt(v)}
                  </text>
                )}
                {shown.has(i) && (
                  <text
                    x={cx}
                    y={height - 8}
                    textAnchor="middle"
                    fontSize={11}
                    fill={MUTED_TEXT}
                  >
                    {labels[i]}
                  </text>
                )}
                <rect
                  x={AXIS.left + band * i}
                  y={AXIS.top}
                  width={band}
                  height={ih}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`${labels[i]}: ${fmt(v)} ${valueLabel}`}
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  className="outline-none"
                />
              </g>
            );
          })}
        </svg>
      )}
      {hover !== null && (
        <Tooltip
          x={AXIS.left + band * hover + band / 2}
          y={y(values[hover])}
          width={width}
        >
          <p className="mb-1 font-bold">{labels[hover]}</p>
          <TipRow color={color} label={valueLabel} value={fmt(values[hover])} />
        </Tooltip>
      )}
    </div>
  );
}

/* ─── Heatmap: weekday × hour, one blue light → dark ──────────────────── */

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function Heatmap({
  values,
  valueLabel,
}: {
  values: number[][];
  valueLabel: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<[number, number] | null>(null);
  const max = Math.max(1, ...values.flat());
  const left = 36;
  const gap = 2;
  const cell = Math.max(8, Math.floor((width - left - gap * 23) / 24));
  const height = 7 * (cell + gap) + 22;
  const step = (v: number) =>
    v === 0
      ? EMPTY_CELL
      : SEQUENTIAL[
          Math.min(
            SEQUENTIAL.length - 1,
            Math.floor((v / max) * SEQUENTIAL.length - 1e-9),
          )
        ];
  const hourLabel = (h: number) =>
    h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;

  return (
    <div className="flex flex-col gap-3">
      <div ref={ref} className="relative w-full" style={{ height }}>
        {width > 0 && (
          <svg
            width={width}
            height={height}
            role="img"
            aria-label="Heatmap by weekday and hour"
          >
            {values.map((row, d) => (
              <g key={d}>
                <text
                  x={0}
                  y={d * (cell + gap) + cell / 2}
                  dy="0.32em"
                  fontSize={11}
                  fill={MUTED_TEXT}
                >
                  {WEEKDAYS[d]}
                </text>
                {row.map((v, h) => (
                  <rect
                    key={h}
                    x={left + h * (cell + gap)}
                    y={d * (cell + gap)}
                    width={cell}
                    height={cell}
                    rx={3}
                    fill={step(v)}
                    stroke={
                      hover && hover[0] === d && hover[1] === h
                        ? "#202321"
                        : "none"
                    }
                    strokeWidth={1.5}
                    tabIndex={0}
                    aria-label={`${WEEKDAYS[d]} ${hourLabel(h)}: ${fmt(v)} ${valueLabel}`}
                    onPointerEnter={() => setHover([d, h])}
                    onPointerLeave={() => setHover(null)}
                    onFocus={() => setHover([d, h])}
                    onBlur={() => setHover(null)}
                    className="outline-none"
                  />
                ))}
              </g>
            ))}
            {[0, 6, 12, 18, 23].map((h) => (
              <text
                key={h}
                x={left + h * (cell + gap) + cell / 2}
                y={height - 4}
                textAnchor="middle"
                fontSize={11}
                fill={MUTED_TEXT}
              >
                {hourLabel(h)}
              </text>
            ))}
          </svg>
        )}
        {hover && (
          <Tooltip
            x={left + hover[1] * (cell + gap) + cell}
            y={hover[0] * (cell + gap)}
            width={width}
          >
            <p className="mb-1 font-bold">
              {WEEKDAYS[hover[0]]}, {hourLabel(hover[1])}–
              {hourLabel((hover[1] + 1) % 24)}
            </p>
            <TipRow
              label={valueLabel}
              value={fmt(values[hover[0]][hover[1]])}
            />
          </Tooltip>
        )}
      </div>
      <div className="text-surface-muted flex items-center gap-2 text-xs">
        <span>Fewer</span>
        <span aria-hidden className="flex gap-0.5">
          {[EMPTY_CELL, ...SEQUENTIAL].map((c) => (
            <span
              key={c}
              className="size-3 rounded-[2px]"
              style={{ background: c }}
            />
          ))}
        </span>
        <span>More</span>
      </div>
    </div>
  );
}

/* ─── Funnel: stages, light → dark blue, with step conversion ─────────── */

export function Funnel({
  steps,
}: {
  steps: { label: string; value: number }[];
}) {
  const max = Math.max(1, ...steps.map((s) => s.value));
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((s, i) => {
        const prev = i > 0 ? steps[i - 1].value : null;
        const conv =
          prev !== null && prev > 0 ? Math.round((s.value / prev) * 100) : null;
        return (
          <li key={s.label} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-bold">{s.label}</span>
              <span className="text-surface-muted text-xs">
                {conv !== null ? `${conv}% of the step before` : " "}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-canvas h-6 flex-1 overflow-hidden rounded-[4px]">
                <div
                  className="h-full rounded-[4px] transition-[width] duration-700"
                  style={{
                    width: `${s.value ? Math.max(1.5, (s.value / max) * 100) : 0}%`,
                    background: ORDINAL[Math.min(ORDINAL.length - 1, i)],
                  }}
                />
              </div>
              <span className="w-12 text-right text-sm font-bold tabular-nums">
                {fmt(s.value)}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ─── Horizontal stacked bars: rows split into parts ──────────────────── */

export function StackedBars({
  rows,
  parts,
}: {
  rows: { label: string; values: Record<string, number> }[];
  parts: { key: string; label: string; color: string }[];
}) {
  const [hover, setHover] = useState<string | null>(null);
  const totals = rows.map((r) =>
    parts.reduce((n, p) => n + (r.values[p.key] ?? 0), 0),
  );
  const max = Math.max(1, ...totals);
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((r, i) => (
        <li key={r.label + i} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-bold">{r.label}</span>
            <span className="font-bold tabular-nums">{fmt(totals[i])}</span>
          </div>
          <div
            className="flex h-6 gap-[2px]"
            style={{ width: `${(totals[i] / max) * 100}%`, minWidth: 6 }}
          >
            {parts.map((p, j) => {
              const v = r.values[p.key] ?? 0;
              if (!v) return null;
              const id = `${i}-${p.key}`;
              const first =
                parts.findIndex((q) => (r.values[q.key] ?? 0) > 0) === j;
              const lastIdx = parts
                .map((q) => (r.values[q.key] ?? 0) > 0)
                .lastIndexOf(true);
              return (
                <span
                  key={p.key}
                  tabIndex={0}
                  title={`${p.label}: ${fmt(v)}`}
                  aria-label={`${r.label}, ${p.label}: ${fmt(v)}`}
                  onPointerEnter={() => setHover(id)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(id)}
                  onBlur={() => setHover(null)}
                  className={cn(
                    "h-full outline-none",
                    first && "rounded-l-[2px]",
                    j === lastIdx && "rounded-r-[4px]",
                  )}
                  style={{
                    flex: v,
                    background: p.color,
                    opacity: hover && hover !== id ? 0.6 : 1,
                  }}
                />
              );
            })}
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ─── Tall segmented bar: one whole split into parts ──────────────────── */

export function SegmentedBar({
  parts,
}: {
  parts: { label: string; value: number; color: string; display: string }[];
}) {
  const total = parts.reduce((n, p) => n + p.value, 0) || 1;
  return (
    <div className="flex flex-col gap-3">
      <div
        className="flex h-7 gap-[2px]"
        role="img"
        aria-label={parts.map((p) => `${p.label} ${p.display}`).join(", ")}
      >
        {parts
          .filter((p) => p.value > 0)
          .map((p) => {
            const share = p.value / total;
            return (
              <span
                key={p.label}
                title={`${p.label}: ${p.display} (${Math.round(share * 100)}%)`}
                className="flex h-full items-center overflow-hidden rounded-[4px] px-2 text-xs font-bold text-white"
                style={{ flex: p.value, background: p.color }}
              >
                {share >= 0.14 ? `${Math.round(share * 100)}%` : ""}
              </span>
            );
          })}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2.5 rounded-[3px]"
              style={{ background: p.color }}
            />
            <span className="font-bold">{p.label}</span>
            <span className="text-surface-muted">{p.display}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── Pictogram: one icon per school website ──────────────────────────── */

export function Pictogram({
  live,
  inProgress,
}: {
  live: number;
  inProgress: number;
}) {
  const total = live + inProgress;
  const per = total > 60 ? Math.ceil(total / 60) : 1;
  const liveIcons = Math.round(live / per);
  const progIcons = Math.round(inProgress / per);
  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex flex-wrap gap-1.5"
        role="img"
        aria-label={`${live} school websites live, ${inProgress} in progress`}
      >
        {Array.from({ length: liveIcons }, (_, i) => (
          <span
            key={`l${i}`}
            className="bg-ice text-royal inline-flex size-8 items-center justify-center rounded-full"
          >
            <GraduationCap aria-hidden className="size-4" />
          </span>
        ))}
        {Array.from({ length: progIcons }, (_, i) => (
          <span
            key={`p${i}`}
            className="text-royal/60 inline-flex size-8 items-center justify-center rounded-full border border-dashed border-current"
          >
            <GraduationCap aria-hidden className="size-4" />
          </span>
        ))}
        {total === 0 && (
          <p className="text-surface-muted text-sm">No school websites yet.</p>
        )}
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
        <li className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="bg-ice text-royal inline-flex size-4 items-center justify-center rounded-full"
          >
            <GraduationCap className="size-2.5" />
          </span>
          <span className="font-bold">{fmt(live)}</span>
          <span className="text-surface-muted">live</span>
        </li>
        <li className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="text-royal/60 inline-flex size-4 items-center justify-center rounded-full border border-dashed border-current"
          />
          <span className="font-bold">{fmt(inProgress)}</span>
          <span className="text-surface-muted">being built</span>
        </li>
        {per > 1 && (
          <li className="text-surface-muted">Each icon = {per} schools</li>
        )}
      </ul>
    </div>
  );
}
