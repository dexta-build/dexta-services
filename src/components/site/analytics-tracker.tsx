"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Visitor analytics without a request per page: page views are queued in
 * the browser and sent together in ONE small beacon when the visitor
 * leaves or hides the page (or every 10 pages). The server turns each
 * batch into one database write of daily totals. No cookies, no IP or
 * personal data, and nothing at all for people whose browser asks not to
 * be tracked, automated browsers, or the team (anyone who has opened the
 * admin on this device).
 */

const QUEUE = "dx-a-queue";
const VISIT = "dx-a-visit";
const SEEN_DAY = "dx-a-day";
export const TEAM_FLAG = "dx-a-team";
const FLUSH_AT = 10;

type Queue = {
  views: string[];
  visit?: boolean;
  visitor?: boolean;
  referrer?: string;
  device?: "mobile" | "tablet" | "desktop";
};

const lagosDay = () =>
  new Date(Date.now() + 3_600_000).toISOString().slice(0, 10);

function store(kind: "local" | "session") {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function read(): Queue {
  try {
    const raw = store("session")?.getItem(QUEUE);
    const q = raw ? (JSON.parse(raw) as Queue) : null;
    return q && Array.isArray(q.views) ? q : { views: [] };
  } catch {
    return { views: [] };
  }
}

function write(q: Queue) {
  try {
    store("session")?.setItem(QUEUE, JSON.stringify(q));
  } catch {
    // Storage full or blocked: the view is simply not counted.
  }
}

function flush() {
  const q = read();
  if (!q.views.length) return;
  const body = JSON.stringify(q);
  let sent = false;
  try {
    sent = navigator.sendBeacon?.(
      "/api/a",
      new globalThis.Blob([body], { type: "application/json" }),
    );
  } catch {
    sent = false;
  }
  if (!sent) {
    void fetch("/api/a", {
      method: "POST",
      body,
      keepalive: true,
      headers: { "content-type": "application/json" },
    }).catch(() => {});
  }
  write({ views: [] });
}

function optedOut() {
  const n = navigator as typeof navigator & { globalPrivacyControl?: boolean };
  return (
    n.webdriver === true ||
    n.doNotTrack === "1" ||
    n.globalPrivacyControl === true ||
    store("local")?.getItem(TEAM_FLAG) === "1"
  );
}

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || optedOut()) return;
    const q = read();
    const session = store("session");
    const local = store("local");

    // The first page of a visit records where they came from and the device.
    if (session && !session.getItem(VISIT)) {
      session.setItem(VISIT, "1");
      q.visit = true;
      let ref = "Direct";
      try {
        const r = document.referrer ? new URL(document.referrer) : null;
        if (r && r.host !== window.location.host)
          ref = r.host.replace(/^www\./, "");
      } catch {
        // Unreadable referrer: counted as direct.
      }
      q.referrer = ref;
      const w = window.innerWidth;
      q.device = w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop";
    }
    // First page today on this device: one visitor for today.
    const today = lagosDay();
    if (local && local.getItem(SEEN_DAY) !== today) {
      local.setItem(SEEN_DAY, today);
      q.visitor = true;
    }
    q.views.push(pathname);
    write(q);
    if (q.views.length >= FLUSH_AT) flush();
  }, [pathname]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  return null;
}

/** Marks this device as the team's so its visits aren't counted. */
export function MarkTeamDevice() {
  useEffect(() => {
    try {
      window.localStorage.setItem(TEAM_FLAG, "1");
    } catch {
      // Storage blocked: nothing to do.
    }
  }, []);
  return null;
}
