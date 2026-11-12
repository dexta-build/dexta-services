/** "just now", "5 min ago", "3 h ago", "2 days ago", then a date. */
export function timeAgo(date: Date | string, now = Date.now()) {
  const d = typeof date === "string" ? new Date(date) : date;
  const s = Math.round((now - d.getTime()) / 1000);
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.round(h / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(d);
}

export function formatDate(date: Date | string, withTime = false) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

/** Turn an audit action like "about.updateHero" into "Update hero". */
export function describeAction(action: string) {
  const AUTH: Record<string, string> = {
    "auth.login": "Signed in",
    "auth.login_failed": "Failed sign-in",
    "auth.login_blocked": "Sign-in blocked (too many attempts)",
    "auth.password_reset_requested": "Asked for a password reset",
    "auth.password_reset": "Reset their password",
    "auth.invite_accepted": "Accepted an invite",
  };
  if (AUTH[action]) return AUTH[action];
  const name = action.includes(".")
    ? action.slice(action.indexOf(".") + 1)
    : action;
  const words = name
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
