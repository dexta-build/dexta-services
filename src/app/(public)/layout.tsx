import { CursorLabel, SiteFooter, SiteHeader } from "@/components/site/shell";
import { fetchContactPageContent, fetchContactSocialLinks } from "@/lib/api";
import { getEvents } from "@/lib/site/events-data";
import type { ResourceHighlight } from "@/lib/site/navigation";
import { getThoughts } from "@/lib/site/thoughts-data";
import { resolveWhatsAppHref } from "@/lib/site/whatsapp";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [contactContent, contactSocialLinks, thoughts, events] =
    await Promise.all([
      fetchContactPageContent(),
      fetchContactSocialLinks(),
      getThoughts(),
      getEvents(),
    ]);

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

  const whatsappHref = resolveWhatsAppHref(
    contactSocialLinks,
    contactContent.phones,
    "Hello Dexta, I'd like to start a project.",
  );

  return (
    <>
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
      />
    </>
  );
}
