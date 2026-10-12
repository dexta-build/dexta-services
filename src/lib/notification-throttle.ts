/**
 * In-memory notification throttler and spam alert monitor.
 * Protects team email inboxes and Brevo quotas from being flooded
 * while tracking automated spam bot activity.
 */

interface ThrottleRecord {
  lastSent: number;
  count: number;
}

declare global {
  var __notificationThrottleStore: Map<string, ThrottleRecord> | undefined;
  var __spamAlertStore: Map<string, number> | undefined;
}

const throttleStore =
  globalThis.__notificationThrottleStore ?? new Map<string, ThrottleRecord>();
globalThis.__notificationThrottleStore = throttleStore;

const spamAlertStore = globalThis.__spamAlertStore ?? new Map<string, number>();
globalThis.__spamAlertStore = spamAlertStore;

/**
 * Checks whether an administrative or team email notification should be sent.
 * Always saves the record to the database, but prevents flooding inboxes
 * if multiple submissions arrive in seconds.
 *
 * @param key Unique identifier (e.g., `contact-admin`, `event:${slug}`)
 * @param minIntervalMs Minimum delay between emails (default: 30 seconds)
 * @param maxPerWindow Maximum emails within window (default: 10 per 5 mins)
 * @param windowMs Rolling window duration (default: 5 mins)
 */
export function shouldSendNotification(
  key: string,
  minIntervalMs = 30_000,
  maxPerWindow = 10,
  windowMs = 5 * 60 * 1000,
): boolean {
  const now = Date.now();
  const record = throttleStore.get(key);

  if (!record) {
    throttleStore.set(key, { lastSent: now, count: 1 });
    return true;
  }

  // Too soon after last sent notification
  if (now - record.lastSent < minIntervalMs) {
    return false;
  }

  // Reset window count if elapsed
  if (now - record.lastSent > windowMs) {
    record.count = 0;
  }

  if (record.count >= maxPerWindow) {
    return false;
  }

  record.lastSent = now;
  record.count += 1;
  return true;
}

/**
 * Logs a structured alert when an automated bot trap or rate limit is triggered.
 */
export function recordSpamAlert({
  formName,
  reason,
  ip,
  details,
}: {
  formName: string;
  reason: "honeypot" | "timing" | "recaptcha" | "rate_limit";
  ip: string;
  details?: Record<string, unknown>;
}) {
  const alertKey = `${formName}:${ip}:${reason}`;
  const count = (spamAlertStore.get(alertKey) ?? 0) + 1;
  spamAlertStore.set(alertKey, count);

  console.warn(
    `[SPAM ALERT #${count}] Intercepted bot on [${formName}] | Reason: ${reason} | IP: ${ip}`,
    details ? JSON.stringify(details) : "",
  );
}
