"use client";

import { useSyncExternalStore } from "react";

/**
 * True while the media query matches. On the server (and during the first
 * render) it returns `serverValue`, so layouts don't jump on hydration.
 */
export function useMediaQuery(query: string, serverValue = false) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

/** Phones: below Tailwind's `sm` breakpoint (640px). */
export function useIsPhone() {
  return useMediaQuery("(max-width: 639.98px)");
}
