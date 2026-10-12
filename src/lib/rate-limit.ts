/**
 * In-memory sliding-window rate limiter.
 *
 * Good for single-server / long-running deployments.
 * For serverless (Vercel), swap to Upstash Redis for cross-instance limits.
 */

interface RateLimitEntry {
  timestamps: number[];
}

declare global {
  var __rateLimitStore: Map<string, RateLimitEntry> | undefined;
}

const store = globalThis.__rateLimitStore ?? new Map<string, RateLimitEntry>();
globalThis.__rateLimitStore = store;

// Clean up stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup(windowMs: number) {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
      if (entry.timestamps.length === 0) store.delete(key);
    }
  }, CLEANUP_INTERVAL);
  // Allow the process to exit without waiting for the timer
  if (
    cleanupTimer &&
    typeof cleanupTimer === "object" &&
    "unref" in cleanupTimer
  ) {
    cleanupTimer.unref();
  }
}

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  max: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetMs: number;
}

export function rateLimit(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  const { max, windowMs } = config;
  const now = Date.now();

  ensureCleanup(windowMs);

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= max) {
    const oldest = entry.timestamps[0] ?? now;
    return {
      success: false,
      remaining: 0,
      resetMs: Math.max(0, oldest + windowMs - now),
    };
  }

  entry.timestamps.push(now);

  return {
    success: true,
    remaining: Math.max(0, max - entry.timestamps.length),
    resetMs: windowMs,
  };
}

export function resetRateLimit(key: string): void {
  store.delete(key);
}

export function formatRateLimitWaitTime(resetMs: number): string {
  const seconds = Math.max(1, Math.ceil(resetMs / 1000));
  if (seconds < 60) {
    return `${seconds} second${seconds === 1 ? "" : "s"}`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

export type HeadersLike = {
  get(name: string): string | null;
};

export function getClientIp(headersList: HeadersLike): string {
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first && first !== "::1" && first !== "127.0.0.1") {
      return first;
    }
  }

  const realIp = headersList.get("x-real-ip");
  if (realIp?.trim() && realIp !== "::1" && realIp !== "127.0.0.1") {
    return realIp.trim();
  }

  const cfIp = headersList.get("cf-connecting-ip");
  if (cfIp?.trim()) {
    return cfIp.trim();
  }

  const clientIp = headersList.get("x-client-ip");
  if (clientIp?.trim()) {
    return clientIp.trim();
  }

  // Fallback for local development or missing proxy headers
  return "127.0.0.1";
}

// Pre-configured limiters for common use cases
export const RATE_LIMITS = {
  /** Public form submissions: 5 per 15 minutes */
  form: { max: 5, windowMs: 15 * 60 * 1000 },
  /** Login attempts: 5 per 15 minutes */
  login: { max: 5, windowMs: 15 * 60 * 1000 },
  /** Contact form: 5 per 15 minutes */
  contact: { max: 5, windowMs: 15 * 60 * 1000 },
} as const;
