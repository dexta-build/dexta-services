import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/content/site-settings";
import { SITE_URL as ENV_SITE_URL } from "@/lib/site/site-url";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const SITE_URL = (await getSiteUrl().catch(() => undefined)) ?? ENV_SITE_URL;
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/design-system"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
