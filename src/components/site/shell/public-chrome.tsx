import { AnalyticsTracker } from "../analytics-tracker";
import { CursorLabel } from "./cursor-label";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { SiteNavProvider } from "./nav-context";
import { PreviewBar } from "./preview-bar";
import {
  getSiteSettings,
  getWhatsApp,
  socialLinks,
} from "@/lib/content/site-settings";
import { isPreviewing } from "@/lib/content/store";
import { getServiceMenu } from "@/lib/services/catalog";
import { getCatalogueMenu } from "@/lib/site/catalogue-store";
import { getEvents } from "@/lib/site/events-data";
import type { ResourceHighlight } from "@/lib/site/navigation";
import { getThoughts } from "@/lib/site/thoughts-data";

/**
 * The public site's header, footer and menus around a page. Used by the
 * public layout and by the site-wide 404 page.
 */
export async function PublicChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const [
    site,
    serviceMenu,
    catalogueMenu,
    whatsappHref,
    preview,
    thoughts,
    events,
  ] = await Promise.all([
    getSiteSettings(),
    getServiceMenu(),
    getCatalogueMenu(),
    getWhatsApp("general"),
    isPreviewing(),
    getThoughts(),
    getEvents(),
  ]);
  const nav = {
    ...site.header,
    serviceGroups: serviceMenu,
    catalogues: catalogueMenu,
  };
  const contactSocialLinks = socialLinks(site.business);
  const contactContent = {
    address: site.business.address,
    emails: site.business.emails,
    phones: site.business.phones,
  };

  // Resources menu cards: the next event, then the latest article(s).
  const now = Date.now();
  const nextEvent = events
    .filter((e) => Date.parse(e.dateTime) > now)
    .sort((a, b) => Date.parse(a.dateTime) - Date.parse(b.dateTime))[0];
  const highlights: ResourceHighlight[] = [
    ...(nextEvent
      ? [
          {
            label: "Upcoming event",
            title: nextEvent.title,
            href: `/events/${nextEvent.slug}`,
            image: nextEvent.image ?? thoughts[0]?.cover ?? "",
          },
        ]
      : []),
    ...thoughts.slice(0, 2).map((t) => ({
      label: "Latest article",
      title: t.title,
      href: `/thoughts/${t.slug}`,
      image: t.cover,
    })),
  ]
    .filter((h) => h.image)
    .slice(0, 2);

  return (
    <SiteNavProvider value={nav}>
      {preview ? <PreviewBar /> : <AnalyticsTracker />}
      <CursorLabel />
      <SiteHeader
        whatsappHref={whatsappHref}
        socials={contactSocialLinks}
        highlights={highlights}
      />
      {children}
      <SiteFooter
        contact={contactContent}
        socials={contactSocialLinks}
        whatsappHref={whatsappHref}
        nav={nav}
        footer={site.footer}
      />
    </SiteNavProvider>
  );
}
