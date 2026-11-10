"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type StatCounterProps = {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label?: React.ReactNode;
  className?: string;
};

/** Big serif number that counts up when it scrolls into view. */
export function StatCounter({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  label,
  className,
}: StatCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const reduce = useReducedMotion();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, value, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: setCurrent,
    });
    return () => controls.stop();
  }, [inView, reduce, value]);

  const shown = reduce ? value : current;
  const formatted = shown.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <span ref={ref} className="text-stat tabular-nums">
        {prefix}
        {formatted}
        {suffix}
      </span>
      {label && (
        <span className="text-surface-muted text-sm leading-snug">{label}</span>
      )}
    </div>
  );
}
