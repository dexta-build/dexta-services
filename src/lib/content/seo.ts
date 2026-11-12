import "server-only";
import type { Metadata } from "next";
import { stock } from "@/lib/site/stock-media";
import type { AnySections, PageDef, SeoData } from "./define";
import { loadPage } from "./store";
import { getSiteSettings } from "./site-settings";

/**
 * Page metadata from the page's "Search & sharing" section, falling back
 * to the site defaults. `absoluteTitle` skips the "| Site name" suffix.
 */
export async function pageMetadata(
  def: PageDef<AnySections>,
  o: { absoluteTitle?: boolean; extra?: Metadata } = {},
): Promise<Metadata> {
  const [{ data }, site] = await Promise.all([
    loadPage(def),
    getSiteSettings(),
  ]);
  const seo = (data as unknown as { seo?: SeoData }).seo;
  const title = seo?.title || site.seo.siteName;
  const description = seo?.description || site.seo.description;
  const imageValue = seo?.image || site.seo.image;
  const image = imageValue ? stock(imageValue, 1200, 630) : undefined;
  return {
    title: o.absoluteTitle ? { absolute: title } : title,
    description,
    ...(def.path ? { alternates: { canonical: def.path } } : {}),
    openGraph: {
      title,
      description,
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    ...(seo?.noIndex ? { robots: { index: false, follow: true } } : {}),
    ...o.extra,
  };
}
