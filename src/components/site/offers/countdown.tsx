"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

/*
 * One shared one-second clock for every countdown on the page. It runs only
 * in the browser while something is subscribed; nothing touches the server.
 */
let now = 0;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

const tick = () => {
  now = Math.floor(Date.now() / 1000) * 1000;
  listeners.forEach((l) => l());
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    tick();
    timer = setInterval(tick, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function getSnapshot() {
  if (!now) now = Math.floor(Date.now() / 1000) * 1000;
  return now;
}

/** Current time in ms (updated every second), or null during server render. */
export function useNow(): number | null {
  return useSyncExternalStore<number | null>(
    subscribe,
    getSnapshot,
    () => null,
  );
}

const UNITS = [
  { label: "Days", short: "d", ms: 86_400_000 },
  { label: "Hours", short: "h", ms: 3_600_000 },
  { label: "Mins", short: "m", ms: 60_000 },
  { label: "Secs", short: "s", ms: 1000 },
];

function parts(remaining: number) {
  let rest = Math.max(0, remaining);
  return UNITS.map((u) => {
    const value = Math.floor(rest / u.ms);
    rest -= value * u.ms;
    return { ...u, value };
  });
}

/**
 * "Ends in 03 : 05 : 12 : 09" boxes. Shows dashes until the browser takes
 * over, so the server and client render the same thing.
 */
export function Countdown({
  endsAt,
  className,
  compact = false,
}: {
  endsAt: string;
  className?: string;
  /** One line ("3d 05h 12m") for small spaces. */
  compact?: boolean;
}) {
  const current = useNow();
  const remaining = current === null ? null : Date.parse(endsAt) - current;
  const items = remaining === null ? null : parts(remaining);
  const ending = remaining !== null && remaining < 86_400_000;
  const endDate = new Date(endsAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

  if (compact) {
    return (
      <span
        className={cn("tabular-nums", className)}
        aria-label={`Ends ${endDate}`}
      >
        {items
          ? items
              .filter((p, i) => i > 0 || p.value > 0)
              .slice(0, 3)
              .map((p) => `${String(p.value).padStart(2, "0")}${p.short}`)
              .join(" ")
          : "--"}
      </span>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className="flex items-center gap-1.5 text-xs font-bold">
        <span
          aria-hidden
          className={cn(
            "size-1.5 rounded-full bg-current",
            ending && "animate-pulse",
          )}
        />
        {ending ? "Ending today" : `Ends ${endDate}`}
      </span>
      <div
        role="timer"
        aria-label={`Ends ${endDate}`}
        className="grid grid-cols-4 gap-1.5"
      >
        {UNITS.map((u, i) => (
          <span
            key={u.label}
            className="bg-surface-fg/8 flex flex-col items-center rounded-[8px] py-2"
          >
            <span className="text-lg leading-none font-bold tabular-nums">
              {items ? String(items[i].value).padStart(2, "0") : "--"}
            </span>
            <span className="text-surface-muted mt-1 text-[0.625rem] font-bold tracking-[0.06em] uppercase">
              {u.label}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
