/**
 * The public address of the site, used for the sitemap, robots.txt,
 * canonical links and social previews.
 *
 * Set NEXT_PUBLIC_SITE_URL in the hosting environment (e.g.
 * https://www.dexta.services). On Vercel the production domain is used
 * automatically when it isn't set.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;
  return "https://dexta.services";
}

export const SITE_URL = resolveSiteUrl();

export const SITE_NAME = "Dexta Synergy Services";

export const SITE_DESCRIPTION =
  "Design, software and print for brands, businesses and life's big moments, from one creative team in Port Harcourt, Nigeria.";
