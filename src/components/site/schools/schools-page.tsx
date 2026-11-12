"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Toaster } from "sonner";
import { CheckCircle2, Mail, MessageCircle, Phone, Play } from "lucide-react";
import { recordSchoolWebsiteTemplateSelection } from "@/app/(public)/webrandschools/actions";
import { RecaptchaProvider } from "@/components/layout/recaptcha-provider";
import { Button } from "@/components/site/button";
import { Container } from "@/components/site/container";
import { Marquee } from "@/components/site/marquee";
import { Reveal, RevealGroup, RevealItem } from "@/components/site/reveal";
import { Section } from "@/components/site/section";
import { getCloudinaryUrl } from "@/lib/cloudinary";
import { CONTACT_SOCIAL_PLATFORM_META } from "@/lib/contact-socials";
import type { ContactSocialLinkData } from "@/lib/contact-defaults";
import {
  withWeBrandSchoolsPageContentDefaults,
  type SchoolPortalFeatureCardData,
  type SchoolPortalSectionContentData,
  type SchoolWebsiteTemplateData,
  type SchoolWebsiteTestimonialData,
  type WeBrandSchoolsPageContentData,
} from "@/lib/we-brand-schools-defaults";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui";
import {
  PortalFeaturePreviewDialog,
  SchoolTestimonialCard,
  TemplateApplicationDialog,
  TemplatePreviewDialog,
  WE_BRAND_SCHOOLS_HERO_IMAGE_FALLBACK,
  WeBrandSchoolsRichText as RichText,
  getSafeYoutubeEmbedUrl,
  resolveImageSource,
  resolvePortalCardPreview,
  resolveTemplateCardPreview,
} from "./parts";

export type SchoolsPageProps = {
  content: WeBrandSchoolsPageContentData;
  testimonials: SchoolWebsiteTestimonialData[];
  templates: SchoolWebsiteTemplateData[];
  portalSectionContent: SchoolPortalSectionContentData;
  portalCards: SchoolPortalFeatureCardData[];
  contact: {
    emails: string[];
    phones: string[];
    socials: ContactSocialLinkData[];
    whatsappHref: string | null;
  };
};

/* Heading styles for copy written in the admin's formatting editor. */
const eyebrow = "text-eyebrow";
const display = "dx-heading text-display font-normal text-balance";
const h1 = "dx-heading text-h1 font-normal text-balance";
const lead = "text-lead [&_p]:mb-3 [&_p:last-child]:mb-0";
const body = "leading-relaxed [&_p]:mb-3 [&_p:last-child]:mb-0";

const filled = (items: string[]) => items.filter((i) => i.trim().length > 0);

/**
 * The We Brand Schools page in the site's design: hero, what it is, what
 * schools say, the free portal, how it works, the templates and help. The
 * copy, media, templates, portal and testimonials all come from the admin.
 */
function SchoolsPageContent({
  content,
  testimonials,
  templates,
  portalSectionContent,
  portalCards,
  contact,
}: SchoolsPageProps) {
  const c = withWeBrandSchoolsPageContentDefaults(content);
  const [previewTemplate, setPreviewTemplate] =
    useState<SchoolWebsiteTemplateData | null>(null);
  const [applicationTemplate, setApplicationTemplate] =
    useState<SchoolWebsiteTemplateData | null>(null);
  const [previewPortalCard, setPreviewPortalCard] =
    useState<SchoolPortalFeatureCardData | null>(null);
  const [portalVideoOpen, setPortalVideoOpen] = useState(false);
  const [batch, setBatch] = useState(2);
  const [visibleCount, setVisibleCount] = useState(2);

  // Two templates at a time on phones and tablets, three on desktops.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      const next = mq.matches ? 3 : 2;
      setBatch(next);
      setVisibleCount((n) => Math.min(templates.length, Math.max(next, n)));
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [templates.length]);

  const visibleTemplates = templates.slice(0, visibleCount);
  const cards = useMemo(
    () => portalCards.filter((p) => p.isVisible).slice(0, 6),
    [portalCards],
  );
  const showPortal = portalSectionContent.isVisible && cards.length > 0;
  const portalHref = portalSectionContent.ctaHref?.trim() ?? "";
  const portalHasLink =
    portalHref.length > 0 &&
    portalHref !== "#" &&
    portalHref !== "#school-portal";
  const portalVideo = getSafeYoutubeEmbedUrl(portalHasLink ? portalHref : null);

  const heroImage = c.heroImagePublicId
    ? resolveImageSource(c.heroImagePublicId, {
        c: "fill",
        g: "auto",
        h: 1500,
        q: "auto",
        w: 1200,
      })
    : WE_BRAND_SCHOOLS_HERO_IMAGE_FALLBACK;
  const email = contact.emails[0];
  const phone = contact.phones[0];
  const helpHref =
    contact.whatsappHref ?? (email ? `mailto:${email}` : "/contact");

  const selectTemplate = (t: SchoolWebsiteTemplateData) => {
    setPreviewTemplate(null);
    setApplicationTemplate(t);
    void recordSchoolWebsiteTemplateSelection(t.slug);
  };

  return (
    <main className="dx-site">
      {/* Hero */}
      <section
        data-surface="royal"
        className="bg-surface text-surface-fg relative isolate overflow-hidden"
      >
        <div aria-hidden className="absolute inset-0 -z-20 lg:hidden">
          <Image
            src={heroImage}
            alt=""
            fill
            priority
            fetchPriority="high"
            sizes="(min-width: 1024px) 1px, 100vw"
            className="object-cover"
          />
        </div>
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-[#00042f]/95 via-[#00042f]/80 to-[#00042f]/60 lg:hidden"
        />
        <Container className="pt-16 pb-16 md:pt-20 md:pb-20 lg:pt-24 lg:pb-24">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
            <Reveal className="flex flex-col items-start gap-6">
              {c.logoPublicId ? (
                // eslint-disable-next-line @next/next/no-img-element -- logo from the media library
                <img
                  src={getCloudinaryUrl(c.logoPublicId, { h: 112, q: "auto" })}
                  alt="We Brand Schools"
                  className="h-14 w-auto object-contain"
                />
              ) : (
                <RichText
                  as="p"
                  mode="inline"
                  value={c.heroEyebrow}
                  className={eyebrow}
                />
              )}
              <RichText
                as="h1"
                mode="inline"
                value={c.heroHeadline}
                className={display}
              />
              <RichText
                as="div"
                mode="block"
                value={c.heroBody}
                className={`${lead} text-surface-fg/85 max-w-xl`}
              />
              <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Button
                  href={c.heroPrimaryCtaHref}
                  size="lg"
                  arrow
                  block="mobile"
                >
                  {c.heroPrimaryCtaText}
                </Button>
                <Button
                  href={c.heroSecondaryCtaHref}
                  size="lg"
                  variant="outline"
                  block="mobile"
                >
                  {c.heroSecondaryCtaText}
                </Button>
              </div>
            </Reveal>
            <Reveal delay={0.15} className="hidden lg:block">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[10px]">
                <Image
                  src={heroImage}
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 1024px) 40vw, 1px"
                  className="object-cover"
                />
              </div>
            </Reveal>
          </div>
          {filled([c.heroFeature1, c.heroFeature2, c.heroFeature3]).length >
            0 && (
            <RevealGroup className="mt-12 grid gap-3 md:grid-cols-3">
              {filled([c.heroFeature1, c.heroFeature2, c.heroFeature3]).map(
                (item, i) => (
                  <RevealItem
                    key={`feature-${i}`}
                    className="bg-surface-card flex items-center gap-3 rounded-[10px] px-5 py-4 ring-1 ring-white/10"
                  >
                    <CheckCircle2
                      aria-hidden
                      className="text-brand-cyan size-5 shrink-0"
                    />
                    <RichText
                      as="p"
                      mode="inline"
                      value={item}
                      className="text-surface-fg/90 text-sm font-bold"
                    />
                  </RevealItem>
                ),
              )}
            </RevealGroup>
          )}
        </Container>
      </section>

      {/* What it is */}
      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
            <Reveal className="flex flex-col items-start gap-5">
              <RichText
                as="p"
                mode="inline"
                value={c.overviewLabel}
                className={`${eyebrow} text-surface-fg/80`}
              />
              <RichText
                as="h2"
                mode="inline"
                value={c.overviewTitle}
                className={h1}
              />
              <RichText
                as="div"
                mode="block"
                value={c.overviewBody}
                className={`${body} text-surface-muted max-w-2xl text-lg`}
              />
              <div className="mt-3 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Button href={c.overviewPrimaryCtaHref} arrow block="mobile">
                  {c.overviewPrimaryCtaText}
                </Button>
                <Button
                  href={c.overviewSecondaryCtaHref}
                  variant="outline"
                  block="mobile"
                >
                  {c.overviewSecondaryCtaText}
                </Button>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="rounded-[10px] bg-white p-6 shadow-[0_24px_60px_-36px_rgb(0_8_107/0.3)] ring-1 ring-black/[0.04] md:p-8">
                <RichText
                  as="p"
                  mode="inline"
                  value={c.overviewBenefitsLabel}
                  className={`${eyebrow} text-royal`}
                />
                <ul className="mt-6 flex flex-col gap-4">
                  {filled([
                    c.overviewBenefit1,
                    c.overviewBenefit2,
                    c.overviewBenefit3,
                    c.overviewBenefit4,
                  ]).map((item, i) => (
                    <li key={`benefit-${i}`} className="flex gap-3">
                      <CheckCircle2
                        aria-hidden
                        className="text-brand-cyan mt-0.5 size-5 shrink-0"
                      />
                      <RichText
                        as="span"
                        mode="inline"
                        value={item}
                        className="leading-relaxed"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* What schools say */}
      {testimonials.length > 0 && (
        <Section surface="ice" className="overflow-hidden">
          <Container>
            <Reveal className="flex max-w-3xl flex-col gap-4">
              <p className={eyebrow}>Testimonials</p>
              <h2 className={h1}>
                Trusted by schools <em>across Nigeria</em>
              </h2>
            </Reveal>
          </Container>
          <div className="mt-10 md:mt-14">
            {testimonials.length > 1 ? (
              <Marquee
                duration={Math.max(30, testimonials.length * 9)}
                gap="1.25rem"
                pauseOnHover
                fade
              >
                {testimonials.map((t) => (
                  <SchoolTestimonialCard key={t.id} testimonial={t} />
                ))}
              </Marquee>
            ) : (
              <div className="flex justify-center px-4">
                <SchoolTestimonialCard testimonial={testimonials[0]} />
              </div>
            )}
          </div>
        </Section>
      )}

      {/* The free portal */}
      {showPortal && (
        <Section surface="royal" id="school-portal" className="scroll-mt-20">
          <Container>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <Reveal className="flex max-w-3xl flex-col gap-4">
                <p className={eyebrow}>{portalSectionContent.eyebrow}</p>
                <h2 className={h1}>{portalSectionContent.title}</h2>
                <p className="text-surface-muted text-lg leading-relaxed">
                  {portalSectionContent.description}
                </p>
              </Reveal>
              {portalSectionContent.ctaText &&
                portalHasLink &&
                (portalVideo ? (
                  <Button size="lg" onClick={() => setPortalVideoOpen(true)}>
                    <Play aria-hidden className="size-4 fill-current" />
                    {portalSectionContent.ctaText}
                  </Button>
                ) : (
                  <Button href={portalHref} size="lg" arrow>
                    {portalSectionContent.ctaText}
                  </Button>
                ))}
            </div>
            <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map((card) => {
                const src = resolvePortalCardPreview(card);
                return (
                  <RevealItem key={card.id}>
                    <button
                      type="button"
                      onClick={() => setPreviewPortalCard(card)}
                      className="group text-charcoal flex h-full w-full flex-col overflow-hidden rounded-[10px] bg-white text-left transition-transform duration-500 ease-(--ease-out-expo) hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-cyan)]"
                    >
                      <span className="bg-canvas relative block aspect-[4/3] overflow-hidden">
                        {src ? (
                          // eslint-disable-next-line @next/next/no-img-element -- media library previews
                          <img
                            src={src}
                            alt=""
                            loading="lazy"
                            className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                          />
                        ) : null}
                      </span>
                      <span className="flex flex-1 flex-col gap-2 p-5">
                        <span className="text-royal text-lg font-bold">
                          {card.title}
                        </span>
                        <span className="text-surface-muted line-clamp-3 text-sm leading-relaxed">
                          {card.summary}
                        </span>
                        <span className="text-royal mt-auto pt-3 text-sm font-bold">
                          <span className="dx-link">See it</span> →
                        </span>
                      </span>
                    </button>
                  </RevealItem>
                );
              })}
            </RevealGroup>
          </Container>
        </Section>
      )}

      {/* How it works */}
      <Section surface="white" id="apply" className="scroll-mt-20">
        <Container>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <Reveal className="flex max-w-3xl flex-col gap-4">
              <RichText
                as="p"
                mode="inline"
                value={c.processLabel}
                className={`${eyebrow} text-surface-fg/80`}
              />
              <RichText
                as="h2"
                mode="inline"
                value={c.processTitle}
                className={h1}
              />
              {c.processBody?.trim() ? (
                <RichText
                  as="div"
                  mode="block"
                  value={c.processBody}
                  className={`${body} text-surface-muted text-lg`}
                />
              ) : null}
            </Reveal>
            <Button href="#templates" arrow>
              Start here
            </Button>
          </div>
          <RevealGroup className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              [c.processStep1Title, c.processStep1Body],
              [c.processStep2Title, c.processStep2Body],
              [c.processStep3Title, c.processStep3Body],
              [c.processStep4Title, c.processStep4Body],
            ].map(([title, text], i) => (
              <RevealItem
                key={`step-${i}`}
                className="bg-canvas flex h-full flex-col gap-3 rounded-[10px] p-6"
              >
                <span className="text-royal font-bold tabular-nums">
                  0{i + 1}
                </span>
                <RichText
                  as="h3"
                  mode="inline"
                  value={title}
                  className="text-h3 font-bold"
                />
                <RichText
                  as="div"
                  mode="block"
                  value={text}
                  className={`${body} text-surface-muted text-sm`}
                />
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      {/* Templates */}
      <Section id="templates" className="scroll-mt-20">
        <Container>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <Reveal className="flex max-w-3xl flex-col gap-4">
              <RichText
                as="p"
                mode="inline"
                value={c.templatesLabel}
                className={`${eyebrow} text-surface-fg/80`}
              />
              <RichText
                as="h2"
                mode="inline"
                value={c.templatesTitle}
                className={h1}
              />
              <RichText
                as="div"
                mode="block"
                value={c.templatesBody}
                className={`${body} text-surface-muted text-lg`}
              />
            </Reveal>
            <Button
              href={helpHref}
              external={helpHref.startsWith("http")}
              variant="outline"
            >
              Need help choosing?
            </Button>
          </div>

          {templates.length ? (
            <>
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {visibleTemplates.map((t, i) => {
                  const src = resolveTemplateCardPreview(t);
                  return (
                    <Reveal
                      key={t.id}
                      delay={(i % batch) * 0.08}
                      className="h-full"
                    >
                      <article className="group flex h-full flex-col overflow-hidden rounded-[10px] bg-white shadow-[0_24px_60px_-40px_rgb(0_8_107/0.35)] ring-1 ring-black/[0.04]">
                        <button
                          type="button"
                          onClick={() => setPreviewTemplate(t)}
                          aria-label={`Preview ${t.name}`}
                          className="bg-canvas relative block aspect-[4/5] overflow-hidden"
                        >
                          {src ? (
                            // eslint-disable-next-line @next/next/no-img-element -- media library previews
                            <img
                              src={src}
                              alt=""
                              loading="lazy"
                              className="size-full object-cover object-top transition-transform duration-[1.2s] ease-(--ease-out-expo) group-hover:scale-[1.03]"
                            />
                          ) : (
                            <span className="text-surface-muted flex size-full items-center justify-center text-sm">
                              Preview coming soon
                            </span>
                          )}
                        </button>
                        <div className="flex flex-1 flex-col gap-4 p-5">
                          <div className="flex flex-col gap-1">
                            <h3 className="text-h3 font-bold">{t.name}</h3>
                            <p className="text-surface-muted line-clamp-2 text-sm leading-relaxed">
                              {t.summary}
                            </p>
                          </div>
                          <div className="mt-auto flex gap-2">
                            <Button
                              size="sm"
                              variant="subtle"
                              onClick={() => setPreviewTemplate(t)}
                            >
                              Preview
                            </Button>
                            <Button size="sm" onClick={() => selectTemplate(t)}>
                              Choose this
                            </Button>
                          </div>
                        </div>
                      </article>
                    </Reveal>
                  );
                })}
              </div>
              {visibleCount < templates.length && (
                <div className="mt-10 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setVisibleCount((n) =>
                        Math.min(templates.length, n + batch),
                      )
                    }
                  >
                    Show more templates
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="border-surface-rule mt-10 flex flex-col items-center gap-4 rounded-[10px] border border-dashed px-6 py-14 text-center">
              <p className="text-h3 font-bold">Templates are on their way</p>
              <p className="text-surface-muted max-w-md">
                We&apos;re adding website templates here. Talk to us and
                we&apos;ll show you what&apos;s ready.
              </p>
              <Button href={helpHref} external={helpHref.startsWith("http")}>
                Talk to us
              </Button>
            </div>
          )}
        </Container>
      </Section>

      {/* Help */}
      <section
        data-surface="canvas"
        className="bg-surface pb-16 md:pb-24"
        id="help"
      >
        <Container>
          <div
            data-surface="royal"
            className="bg-surface text-surface-fg grid gap-10 rounded-[10px] p-6 md:p-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center xl:p-16"
          >
            <div className="flex flex-col items-start gap-5">
              <p className={eyebrow}>Need help?</p>
              <h2 className={h1}>
                Questions before you <em>apply</em>?
              </h2>
              <p className="text-surface-muted text-lg leading-relaxed">
                Talk to the team. We&apos;ll help you pick a template and walk
                you through what happens next.
              </p>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Button
                  href={helpHref}
                  external={helpHref.startsWith("http")}
                  size="lg"
                  arrow
                  block="mobile"
                >
                  Chat with us
                </Button>
                <Button
                  href="#templates"
                  size="lg"
                  variant="outline"
                  block="mobile"
                >
                  Back to templates
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="bg-surface-card flex items-center gap-4 rounded-[10px] p-5 ring-1 ring-white/10 transition-colors hover:bg-white/10"
                >
                  <Mail
                    aria-hidden
                    className="text-brand-cyan size-5 shrink-0"
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="text-surface-muted text-xs font-bold tracking-[0.08em] uppercase">
                      Email
                    </span>
                    <span className="truncate font-bold">{email}</span>
                  </span>
                </a>
              )}
              {phone && (
                <a
                  href={`tel:${phone.replace(/\s+/g, "")}`}
                  className="bg-surface-card flex items-center gap-4 rounded-[10px] p-5 ring-1 ring-white/10 transition-colors hover:bg-white/10"
                >
                  <Phone
                    aria-hidden
                    className="text-brand-cyan size-5 shrink-0"
                  />
                  <span className="flex flex-col">
                    <span className="text-surface-muted text-xs font-bold tracking-[0.08em] uppercase">
                      Phone
                    </span>
                    <span className="font-bold">{phone}</span>
                  </span>
                </a>
              )}
              {contact.whatsappHref && (
                <a
                  href={contact.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-surface-card flex items-center gap-4 rounded-[10px] p-5 ring-1 ring-white/10 transition-colors hover:bg-white/10"
                >
                  <MessageCircle
                    aria-hidden
                    className="text-brand-cyan size-5 shrink-0"
                  />
                  <span className="flex flex-col">
                    <span className="text-surface-muted text-xs font-bold tracking-[0.08em] uppercase">
                      WhatsApp
                    </span>
                    <span className="font-bold">Message us</span>
                  </span>
                </a>
              )}
              {contact.socials.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {contact.socials.map((s) => {
                    const Icon = CONTACT_SOCIAL_PLATFORM_META[s.platform]?.icon;
                    if (!Icon) return null;
                    return (
                      <a
                        key={`${s.platform}-${s.href}`}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.label}
                        title={s.label}
                        className="bg-surface-card hover:bg-brand-cyan hover:text-royal inline-flex size-11 items-center justify-center rounded-full ring-1 ring-white/10 transition-colors"
                      >
                        <Icon aria-hidden className="size-4" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      <Dialog open={portalVideoOpen} onOpenChange={setPortalVideoOpen}>
        <DialogContent className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-5xl">
          <DialogHeader className="border-surface-rule border-b px-6 py-5 pr-14">
            <DialogTitle className="text-2xl">
              {portalSectionContent.ctaText ?? "Portal video"}
            </DialogTitle>
            <DialogDescription>{portalSectionContent.title}</DialogDescription>
          </DialogHeader>
          <div className="bg-canvas p-4 sm:p-6">
            <div className="bg-royal aspect-video overflow-hidden rounded-[10px]">
              {portalVideoOpen && portalVideo ? (
                <iframe
                  src={`${portalVideo}?autoplay=1&rel=0`}
                  title={`${portalSectionContent.title} video`}
                  className="size-full"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PortalFeaturePreviewDialog
        card={previewPortalCard}
        onOpenChange={(open) => !open && setPreviewPortalCard(null)}
      />
      <TemplatePreviewDialog
        template={previewTemplate}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
        onSelectTemplate={selectTemplate}
      />
      <TemplateApplicationDialog
        template={applicationTemplate}
        onOpenChange={(open) => !open && setApplicationTemplate(null)}
      />
    </main>
  );
}

export function SchoolsPage(props: SchoolsPageProps) {
  return (
    <RecaptchaProvider>
      <SchoolsPageContent {...props} />
      <Toaster position="top-center" richColors />
    </RecaptchaProvider>
  );
}
