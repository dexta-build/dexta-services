/**
 * Event times are typed as the clock time where the event happens (its
 * timezone), whatever the admin's own computer is set to. Safe anywhere.
 */

export const TIMEZONES = [
  { value: "Africa/Lagos", label: "Lagos, Abuja (WAT)" },
  { value: "Africa/Accra", label: "Accra (GMT)" },
  { value: "Africa/Nairobi", label: "Nairobi (EAT)" },
  { value: "Africa/Johannesburg", label: "Johannesburg (SAST)" },
  { value: "Africa/Cairo", label: "Cairo" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Paris, Berlin, Amsterdam" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "America/New_York", label: "New York, Toronto" },
  { value: "America/Chicago", label: "Chicago" },
  { value: "America/Los_Angeles", label: "Los Angeles" },
  { value: "UTC", label: "UTC" },
];

/** Minutes the zone is ahead of UTC at that moment. */
function offsetMs(at: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(at));
  const n = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(
    n("year"),
    n("month") - 1,
    n("day"),
    n("hour") % 24,
    n("minute"),
    n("second"),
  );
  return asUtc - Math.floor(at / 1000) * 1000;
}

/** "2026-03-28T10:30" in Africa/Lagos → ISO instant. Null if not valid. */
export function zonedToIso(local: string, timeZone: string): string | null {
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const wall = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  let at = wall - offsetMs(wall, timeZone);
  at = wall - offsetMs(at, timeZone); // settle around clock changes
  return Number.isNaN(at) ? null : new Date(at).toISOString();
}

/** ISO instant → "2026-03-28T10:30" as the clock reads in that zone. */
export function isoToZoned(iso: string | null, timeZone: string): string {
  if (!iso) return "";
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return "";
  const d = new Date(at + offsetMs(at, timeZone));
  return d.toISOString().slice(0, 16);
}
