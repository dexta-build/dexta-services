import { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

/**
 * Visitor analytics intake. Browsers send a batch of page views once per
 * visit (see components/site/analytics-tracker.tsx); each batch becomes ONE
 * database statement adding to daily totals. Nothing personal is stored:
 * no IP, no cookies, no user agent. Bots and oversized or malformed
 * batches are ignored. Always answers 204 so it never shows an error.
 */

export const runtime = "nodejs";

const BOT =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|headless|lighthouse|pingdom|uptime|curl|wget|python|axios|node-fetch/i;

const ok = () => new globalThis.Response(null, { status: 204 });

const cleanPath = (p: unknown) => {
  if (typeof p !== "string" || !p.startsWith("/") || p.length > 200)
    return null;
  const path = p.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (path.startsWith("/admin") || path.startsWith("/api")) return null;
  return path;
};

export async function POST(request: NextRequest) {
  const ua = request.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua)) return ok();

  // A visit sends one batch; this only stops someone flooding the endpoint.
  const ip = getClientIp(request.headers);
  if (!rateLimit(`analytics:${ip}`, { max: 30, windowMs: 10 * 60_000 }).success)
    return ok();

  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 8000) return ok();
    body = JSON.parse(text);
  } catch {
    return ok();
  }
  if (!body || typeof body !== "object") return ok();
  const b = body as Record<string, unknown>;
  const views = (Array.isArray(b.views) ? b.views : [])
    .slice(0, 25)
    .map(cleanPath)
    .filter((p): p is string => !!p);
  if (!views.length) return ok();

  const country = (request.headers.get("x-vercel-ip-country") ?? "")
    .toUpperCase()
    .slice(0, 2);
  const referrer =
    typeof b.referrer === "string"
      ? b.referrer
          .toLowerCase()
          .replace(/[^a-z0-9.-]/g, "")
          .slice(0, 80) || "Direct"
      : "Direct";
  const device =
    b.device === "mobile" || b.device === "tablet" || b.device === "desktop"
      ? b.device
      : "desktop";

  // Totals to add, keyed kind + key.
  const add = new Map<string, number>();
  const bump = (kind: string, key = "", n = 1) =>
    add.set(`${kind}\u0000${key}`, (add.get(`${kind}\u0000${key}`) ?? 0) + n);
  bump("views", "", views.length);
  for (const p of views) bump("page", p);
  if (b.visit === true) {
    bump("visits");
    bump("referrer", referrer === "direct" ? "Direct" : referrer);
    bump("device", device);
    if (/^[A-Z]{2}$/.test(country)) bump("country", country);
  }
  if (b.visitor === true) bump("visitors");

  const day = new Date(Date.now() + 3_600_000).toISOString().slice(0, 10);
  const rows = [...add].map(([k, n]) => {
    const [kind, key] = k.split("\u0000");
    return Prisma.sql`(${day}::date, ${kind}, ${key}, ${n})`;
  });

  try {
    await prisma.$executeRaw`
      INSERT INTO "AnalyticsCount" ("day", "kind", "key", "count")
      VALUES ${Prisma.join(rows)}
      ON CONFLICT ("day", "kind", "key")
      DO UPDATE SET "count" = "AnalyticsCount"."count" + EXCLUDED."count"`;
  } catch (error) {
    // Table not created yet (before the database update), or a hiccup:
    // the visit just isn't counted.
    console.error("[analytics]", (error as Error).message);
  }
  return ok();
}
