"use client";

import { ArrowUp } from "lucide-react";

export function BackToTop() {
  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => {
        const reduce = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      }}
      className="bg-brand-cyan text-royal ml-2 inline-flex size-11 items-center justify-center rounded-full transition-transform hover:-translate-y-0.5"
    >
      <ArrowUp className="size-4" />
    </button>
  );
}
