"use client";

import { useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

type DigitRollerProps = {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
};

/**
 * Slot-machine number, as on Superside: each digit is a 0–9 strip that
 * slides to its value. It resets when it leaves the screen, so it rolls
 * again every time you scroll back to it.
 */
export function DigitRoller({
  value,
  prefix = "",
  suffix = "",
  className,
}: DigitRollerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { amount: 0.6 });
  const reduce = useReducedMotion();
  const run = reduce || inView;
  const chars = value.toLocaleString("en-US").split("");
  const digitCount = chars.filter((c) => /\d/.test(c)).length;
  let digitIndex = 0;

  return (
    <span
      ref={ref}
      className={cn("inline-flex items-baseline leading-none", className)}
    >
      {/* Screen readers read the final number; the rolling digits are visual. */}
      <span className="sr-only">{`${prefix}${value.toLocaleString("en-US")}${suffix}`}</span>
      <span aria-hidden className="inline-flex">
        {prefix && <span>{prefix}</span>}
        {chars.map((char, i) => {
          if (!/\d/.test(char)) return <span key={i}>{char}</span>;
          const digit = Number(char);
          // Rightmost digits travel furthest and land last, like a counter.
          const order = digitIndex++;
          const delay = (digitCount - order) * 0.07;
          return (
            <span
              key={i}
              className="relative inline-block h-[1em] overflow-hidden"
              style={{
                maskImage:
                  "linear-gradient(to bottom, transparent, #000 12%, #000 88%, transparent)",
              }}
            >
              {/* Invisible copy sets the width of this digit */}
              <span className="invisible">{char}</span>
              <span
                className="absolute inset-x-0 top-0 flex flex-col"
                style={{
                  transform: `translateY(-${run ? digit * 10 : 0}%)`,
                  transition: run
                    ? `transform 1.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`
                    : "none",
                }}
              >
                {DIGITS.map((d) => (
                  <span key={d} className="h-[1em] text-center">
                    {d}
                  </span>
                ))}
              </span>
            </span>
          );
        })}
        {suffix && <span>{suffix}</span>}
      </span>
    </span>
  );
}
