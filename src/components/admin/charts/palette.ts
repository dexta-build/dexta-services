/* Shared by server and client chart code (no "use client" here). */

/**
 * Chart colours, validated for colour vision deficiency and contrast on the
 * white card surface (dataviz validator, light mode):
 * - Series: ocean / coral / mint (brand tokens) — all-pairs CVD ΔE ≥ 9.2,
 *   normal-vision ΔE ≥ 24. Coral and mint sit under 3:1 on white, so every
 *   chart has a legend and a table view.
 * - Ordinal (funnels): one blue, light → dark, light end ≥ 2:1.
 * - Status: fixed good / warning / critical, always with a text label.
 */
export const SERIES = {
  messages: "#007fc2",
  registrations: "#ff7a5c",
  applications: "#34c9a0",
} as const;
/** Visitors and page views: series slots 1 and 2 (validated above). */
export const TRAFFIC = { visitors: "#007fc2", views: "#ff7a5c" } as const;
export const ORDINAL = ["#86b6ef", "#3987e5", "#1c5cab", "#0d366b"];
export const SEQUENTIAL = [
  "#cde2fb",
  "#9ec5f4",
  "#6da7ec",
  "#3987e5",
  "#256abf",
  "#184f95",
  "#0d366b",
];
export const STATUS = {
  good: "#0ca30c",
  warning: "#fab219",
  critical: "#d03b3b",
} as const;
export const ACCENT = "#007fc2";
export const GRID = "#ececea";
export const EMPTY_CELL = "#f3f3f0";
export const MUTED_TEXT = "#5f625f";

export const fmt = (n: number) => new Intl.NumberFormat("en-GB").format(n);
export const compact = (n: number) =>
  new Intl.NumberFormat("en-GB", {
    notation: n >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(n);
