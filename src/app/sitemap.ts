import type { MetadataRoute } from "next";
import { getServiceCatalog } from "@/lib/services/catalog";
import { getCatalogues } from "@/lib/site/catalogue-store";
import { getEvents } from "@/lib/site/events-data";
import { getExpressions } from "@/lib/site/expressions-data";
import { getSiteUrl } from "@/lib/content/site-settings";
import { SITE_URL as ENV_SITE_URL } from "@/lib/site/site-url";
import { getTeam } from "@/lib/site/team-data";
import { getThoughtCategories, getThoughts } from "@/lib/site/thoughts-data";
import { getWorks } from "@/lib/site/works-data";

/**
 * Every public page: the main sections plus each service, catalogue item,
 * work, article, event, product and team profile. Built from the same
 * cached data as the pages (no extra database load).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const SITE_URL = (await getSiteUrl().catch(() => undefined)) ?? ENV_SITE_URL;
  const catalog = await getServiceCatalog();
  const now = new Date();
  const page = (
    path: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "monthly",
    lastModified: Date = now,
  ) => ({ url: `${SITE_URL}${path}`, lastModified, changeFrequency, priority });

  const safe = async <T>(p: Promise<T>, fallback: T) => {
    try {
      return await p;
    } catch {
      return fallback;
    }
  };

  const [works, thoughts, categories, events, expressions, team] =
    await Promise.all([
      safe(getWorks(), []),
      safe(getThoughts(), []),
      safe(getThoughtCategories(), []),
      safe(getEvents(), []),
      safe(getExpressions(), []),
      safe(getTeam(), []),
    ]);
  const catalogues = await getCatalogues();

  return [
    page("", 1, "weekly"),
    page("/services", 0.9),
    ...catalog.map((p) => page(`/services/${p.key}`, 0.8)),
    ...catalog.flatMap((p) =>
      p.services
        .filter((s) => !s.externalHref)
        .map((s) => page(`/services/${p.key}/${s.slug}`, 0.7)),
    ),
    page("/catalogue", 0.9, "weekly"),
    ...catalogues.map((c) => page(`/catalogue/${c.slug}`, 0.8, "weekly")),
    ...catalogues.flatMap((c) =>
      c.items.map((i) => page(`/catalogue/${c.slug}/${i.slug}`, 0.5)),
    ),
    page("/offers", 0.8, "weekly"),
    page("/works", 0.8, "weekly"),
    ...works.map((w) => page(`/works/${w.slug}`, 0.6)),
    page("/thoughts", 0.7, "weekly"),
    ...categories.map((c) => page(`/thoughts/category/${c.slug}`, 0.5)),
    ...thoughts.map((t) =>
      page(`/thoughts/${t.slug}`, 0.6, "monthly", new Date(t.publishedAt)),
    ),
    page("/events", 0.7, "weekly"),
    ...events
      .filter((e) => !e.sample)
      .map((e) => page(`/events/${e.slug}`, 0.6)),
    page("/expressions", 0.7),
    ...expressions.map((e) => page(`/expressions/${e.slug}`, 0.6)),
    page("/about", 0.8),
    ...team.filter((m) => !m.sample).map((m) => page(`/${m.slug}`, 0.5)),
    page("/contact", 0.7, "yearly"),
    page("/webrandschools", 0.6),
  ];
}
