import type { Metadata } from "next";
import { ArrowUpRight, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContactFormEmbed } from "@/components/site/contact-form";
import { AccentText } from "@/components/site/accent-text";
import { autoAccent } from "@/components/site/about/about-icon";
import { Button } from "@/components/site/button";
import { Container } from "@/components/site/container";
import { Eyebrow } from "@/components/site/eyebrow";
import { Heading } from "@/components/site/heading";
import { FaqSection } from "@/components/site/services/faq-section";
import { CONTACT_PAGE } from "@/lib/content/pages/main";
import { pageMetadata } from "@/lib/content/seo";
import {
  getSiteSettings,
  getWhatsApp,
  socialLinks,
} from "@/lib/content/site-settings";
import { loadPage } from "@/lib/content/store";
import { CONTACT_SOCIAL_PLATFORM_META } from "@/lib/contact-socials";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(CONTACT_PAGE);
}

/**
 * Talk to us: WhatsApp first (the fastest way to reach us), contact
 * details and socials, and the existing contact form with reCAPTCHA.
 */
export default async function ContactPage() {
  const [{ data: c, hidden }, site, whatsapp] = await Promise.all([
    loadPage(CONTACT_PAGE),
    getSiteSettings(),
    getWhatsApp("general"),
  ]);
  const socials = socialLinks(site.business);
  const content = {
    ...c.details,
    address: site.business.address,
    emails: site.business.emails,
    phones: site.business.phones,
  };
  const visibleSocials = socials
    .filter((s) => s.isVisible && s.href)
    .sort((a, b) => a.position - b.position);
  const mapQuery = encodeURIComponent(content.address);

  return (
    <main className="dx-site">
      <section className="bg-canvas pt-12 pb-10 md:pt-16 md:pb-14">
        <Container className="flex max-w-4xl flex-col items-center gap-5 text-center">
          {c.hero.eyebrow && <Eyebrow>{c.hero.eyebrow}</Eyebrow>}
          <Heading size="display" as="h1">
            <AccentText text={autoAccent(c.hero.title)} />
          </Heading>
          <p className="text-lead text-surface-muted max-w-2xl">
            {c.hero.body}
          </p>
        </Container>
      </section>

      <section className="bg-canvas pb-16 md:pb-24">
        <Container className="grid gap-6 lg:grid-cols-[1fr_1.15fr] lg:gap-10">
          {/* Ways to reach us */}
          <div className="flex flex-col gap-4">
            {whatsapp && !hidden.whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                data-surface="royal"
                className="group bg-surface text-surface-fg flex flex-col gap-6 rounded-[10px] p-6 md:p-8"
              >
                <span className="flex items-center justify-between">
                  <span className="bg-brand-cyan text-royal inline-flex size-12 items-center justify-center rounded-full">
                    <MessageCircle aria-hidden className="size-6" />
                  </span>
                  <ArrowUpRight
                    aria-hidden
                    className="size-6 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                  />
                </span>
                <span>
                  <span className="text-eyebrow text-surface-muted block">
                    {c.whatsapp.eyebrow}
                  </span>
                  <span className="text-h2 mt-2 block">
                    <AccentText text={c.whatsapp.title} />
                  </span>
                  <span className="text-surface-fg/75 mt-2 block text-sm">
                    {c.whatsapp.body}
                  </span>
                </span>
              </a>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {content.emails.length > 0 && (
                <div
                  data-surface="ice"
                  className="bg-surface text-surface-fg flex flex-col gap-3 rounded-[10px] p-6"
                >
                  <Mail aria-hidden className="size-6" />
                  <p className="text-eyebrow text-surface-muted">
                    {content.emailLabel}
                  </p>
                  {content.emails.map((e) => (
                    <a
                      key={e}
                      href={`mailto:${e}`}
                      className="dx-link font-bold break-all"
                    >
                      {e}
                    </a>
                  ))}
                </div>
              )}
              {content.phones.length > 0 && (
                <div
                  data-surface="mint"
                  className="bg-surface text-surface-fg flex flex-col gap-3 rounded-[10px] p-6"
                >
                  <Phone aria-hidden className="size-6" />
                  <p className="text-eyebrow text-surface-muted">
                    {content.phoneLabel}
                  </p>
                  {content.phones.map((p) => (
                    <a
                      key={p}
                      href={`tel:${p.replace(/[^\d+]/g, "")}`}
                      className="dx-link font-bold"
                    >
                      {p}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {content.address && c.map.show && (
              <div
                data-surface="gold"
                className="bg-surface text-surface-fg flex flex-col gap-3 rounded-[10px] p-6"
              >
                <MapPin aria-hidden className="size-6" />
                <p className="text-eyebrow text-surface-muted">
                  {content.addressLabel}
                </p>
                <p className="font-bold">{content.address}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dx-link inline-flex items-center gap-1 self-start text-sm font-bold"
                >
                  Get directions
                  <ArrowUpRight aria-hidden className="size-4" />
                </a>
              </div>
            )}

            {visibleSocials.length > 0 && (
              <div className="flex flex-col gap-3 pt-2">
                <p className="text-eyebrow text-surface-muted">
                  {content.socialsLabel}
                </p>
                <ul className="flex flex-wrap gap-2">
                  {visibleSocials.map((s) => {
                    const Icon = CONTACT_SOCIAL_PLATFORM_META[s.platform].icon;
                    return (
                      <li key={`${s.platform}-${s.href}`}>
                        <a
                          href={s.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={s.label}
                          className="border-surface-fg/25 hover:bg-surface-fg hover:text-surface inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors"
                        >
                          <Icon className="size-4" />
                          {s.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* Form */}
          <div className="flex flex-col gap-6 lg:sticky lg:top-28 lg:self-start">
            <div className="flex flex-col gap-3">
              {c.form.eyebrow && <Eyebrow>{c.form.eyebrow}</Eyebrow>}
              <Heading size="h2">
                <AccentText text={autoAccent(c.form.title)} />
              </Heading>
              <p className="text-surface-muted leading-relaxed">
                {c.form.body}
              </p>
            </div>
            <ContactFormEmbed labels={c.form} />
          </div>
        </Container>
      </section>

      {content.address && (
        <section className="bg-canvas pb-16 md:pb-24">
          <Container>
            <div className="relative overflow-hidden rounded-[10px] ring-1 ring-black/5">
              <iframe
                title={`Map of ${content.address}`}
                src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="block h-[22rem] w-full grayscale-[30%] md:h-[28rem]"
              />
            </div>
          </Container>
        </section>
      )}

      {!hidden.faq && <FaqSection title={c.faq.title} faqs={c.faq.items} />}

      {!hidden.browse && (
        <section data-surface="royal" className="bg-surface text-surface-fg">
          <Container className="flex flex-col items-start gap-6 py-14 md:flex-row md:items-center md:justify-between md:py-20">
            <Heading size="h2" className="max-w-2xl">
              <AccentText text={c.browse.title} />
            </Heading>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button href={c.browse.primary.href} arrow>
                {c.browse.primary.label}
              </Button>
              <Button href={c.browse.secondary.href} variant="outline">
                {c.browse.secondary.label}
              </Button>
            </div>
          </Container>
        </section>
      )}
    </main>
  );
}
