import type { Metadata } from "next";
import { AccentText } from "@/components/site/accent-text";
import { AboutIcon, autoAccent } from "@/components/site/about/about-icon";
import { Button } from "@/components/site/button";
import { ClosingCta } from "@/components/site/closing-cta";
import { Container } from "@/components/site/container";
import { Eyebrow } from "@/components/site/eyebrow";
import { Heading } from "@/components/site/heading";
import { LogoStrip } from "@/components/site/home/logo-strip";
import { TestimonialsCarousel } from "@/components/site/home/testimonials-carousel";
import { MediaAsset } from "@/components/site/media-asset";
import { Reveal, RevealGroup, RevealItem } from "@/components/site/reveal";
import { Section } from "@/components/site/section";
import { TeamCarousel } from "@/components/site/team/team-carousel";
import {
  fetchAboutExpertiseItems,
  fetchAboutMilestones,
  fetchAboutPageContent,
  fetchAboutSpaceItems,
  fetchAboutValueItems,
} from "@/lib/api";
import { getHomeData } from "@/lib/site/home-data";
import { imageUrl } from "@/lib/site/media";
import { getWhatsAppHref } from "@/lib/site/page-context";
import { STOCK, stock } from "@/lib/site/stock-media";
import { getTeam } from "@/lib/site/team-data";

export async function generateMetadata(): Promise<Metadata> {
  const content = await fetchAboutPageContent();
  return {
    alternates: { canonical: "/about" },
    title: "About us",
    description: content.heroBody,
  };
}

/** Stand-in photos while studio images are missing. */
const SPACE_FALLBACKS = [
  STOCK.teamWhiteboard,
  STOCK.teamCafe,
  STOCK.teamLaptopCasual,
  STOCK.teamLibrary,
];

/**
 * About us, patterned on Superside's: dark hero, statement, logos, a dark
 * story band, what we bring, the team carousel, our journey, values, our
 * space, testimonials and a closing call to action.
 */
export default async function AboutPage() {
  const [content, milestones, expertise, values, space, team, home, whatsapp] =
    await Promise.all([
      fetchAboutPageContent(),
      fetchAboutMilestones(),
      fetchAboutExpertiseItems(),
      fetchAboutValueItems(),
      fetchAboutSpaceItems(),
      getTeam(),
      getHomeData(),
      getWhatsAppHref("Hello Dexta, I'd like to talk about a project."),
    ]);

  const stats = [
    [content.heroStat1Value, content.heroStat1Label],
    [content.heroStat2Value, content.heroStat2Label],
    [content.heroStat3Value, content.heroStat3Label],
    [content.heroStat4Value, content.heroStat4Label],
  ].filter(([v]) => v);

  const spaceImages = space.map((s, i) => ({
    ...s,
    src:
      s.mediaType === "VIDEO"
        ? s.thumbnailPublicId
          ? imageUrl(s.thumbnailPublicId, 1400)
          : stock(SPACE_FALLBACKS[i % 4], 1400)
        : s.mediaPublicId
          ? imageUrl(s.mediaPublicId, 1400)
          : stock(SPACE_FALLBACKS[i % 4], 1400),
    fallback: stock(SPACE_FALLBACKS[i % 4], 1400),
  }));
  const heroImage = content.heroBackgroundImagePublicId
    ? imageUrl(content.heroBackgroundImagePublicId, 2400)
    : stock(STOCK.teamMeeting, 2400);

  return (
    <main className="dx-site">
      {/* Hero */}
      <Section surface="royal" spacing="none">
        <Container className="grid gap-8 pt-12 pb-12 md:pt-16 md:pb-16 lg:grid-cols-[1.4fr_1fr] lg:items-end lg:gap-16 lg:pt-24 lg:pb-20">
          <div className="flex flex-col gap-5">
            <Eyebrow>{content.heroEyebrow}</Eyebrow>
            <Heading size="display" as="h1">
              <AccentText text={autoAccent(content.heroHeadline)} />
            </Heading>
          </div>
          <div className="flex flex-col items-start gap-6">
            <p className="text-lead text-surface-fg/80">{content.heroBody}</p>
            <Button href="/contact" size="lg" arrow>
              Talk to us
            </Button>
          </div>
        </Container>
        <div className="relative h-[16rem] w-full md:h-[24rem] lg:h-[30rem]">
          <MediaAsset
            media={{ kind: "image", src: heroImage, alt: "" }}
            sizes="100vw"
            // Not preloaded: on phones the photo sits mostly below the fold and
            // would compete with the headline (the real LCP) for bandwidth.
            fallbackSrc={stock(STOCK.teamMeeting, 2400)}
          />
        </div>
      </Section>

      {/* Statement */}
      <section className="bg-canvas pt-16 md:pt-24 lg:pt-32">
        <Container className="max-w-4xl text-center">
          <Reveal>
            <p className="text-h2 leading-snug">
              {content.storyHighlightTitle}.{" "}
              <span className="text-surface-muted">
                {content.storyHighlightBody}
              </span>
            </p>
          </Reveal>
        </Container>
      </section>

      <LogoStrip brands={home.brands} />

      {/* Story: dark band with stats */}
      <Section surface="royal">
        <Container className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
          <div className="flex flex-col gap-6">
            <Eyebrow>{content.storyLabel}</Eyebrow>
            <Heading size="h1">
              <AccentText text={autoAccent(content.storyTitle)} />
            </Heading>
            <p className="text-surface-fg/85 text-lg leading-relaxed">
              {content.storyBody1}
            </p>
            <p className="text-surface-muted leading-relaxed">
              {content.storyBody2}
            </p>
            {content.storyTrustedItems.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-surface-muted mr-1 text-sm">
                  {content.storyTrustedLabel}
                </span>
                {content.storyTrustedItems.map((t) => (
                  <span
                    key={t}
                    className="border-surface-fg/30 rounded-full border px-3 py-1 text-sm"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[10px]">
              <MediaAsset
                media={{
                  kind: "image",
                  src: spaceImages[0]?.src ?? stock(STOCK.teamWhiteboard, 1400),
                  alt: "",
                }}
                sizes="(min-width: 1024px) 45vw, 100vw"
                fallbackSrc={stock(STOCK.teamWhiteboard, 1400)}
              />
            </div>
            {stats.length > 0 && (
              <dl className="border-surface-rule grid grid-cols-2 border-t">
                {stats.map(([value, label]) => (
                  <div
                    key={label}
                    className="border-surface-rule flex flex-col gap-1 border-b py-5 odd:border-r odd:pr-4 even:pl-5"
                  >
                    <dt className="sr-only">{label}</dt>
                    <dd className="font-[family-name:var(--font-accent)] text-5xl leading-none md:text-6xl">
                      {value}
                    </dd>
                    <dd className="text-surface-muted text-sm">{label}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </Container>
      </Section>

      {/* What we bring */}
      {expertise.length > 0 && (
        <Section>
          <Container>
            <div className="mx-auto mb-12 flex max-w-3xl flex-col items-center gap-4 text-center md:mb-16">
              <Eyebrow>{content.expertiseLabel}</Eyebrow>
              <Heading size="h1">
                <AccentText text={autoAccent(content.expertiseTitle)} />
              </Heading>
              <p className="text-surface-muted text-lg">
                {content.expertiseBody}
              </p>
            </div>
            <RevealGroup className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {expertise.map((item) => (
                <RevealItem key={item.title} className="flex flex-col gap-3">
                  <span className="border-surface-fg/15 inline-flex size-12 items-center justify-center rounded-[10px] border bg-white">
                    <AboutIcon name={item.icon} className="size-6" />
                  </span>
                  <p className="text-eyebrow text-surface-muted mt-3">
                    {item.metricValue}
                  </p>
                  <h3 className="text-h3">{item.title}</h3>
                  <p className="text-surface-muted text-sm leading-relaxed">
                    {item.description}
                  </p>
                </RevealItem>
              ))}
            </RevealGroup>
          </Container>
        </Section>
      )}

      {/* Team */}
      {team.length > 0 && (
        <Section id="team" surface="white" className="scroll-mt-20">
          <Container>
            <div className="mb-10 flex flex-col gap-6 md:mb-14 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex max-w-3xl flex-col gap-4">
                <Eyebrow>{content.teamLabel}</Eyebrow>
                <Heading size="h1">
                  <AccentText text={autoAccent(content.teamTitle)} />
                </Heading>
              </div>
              <p className="text-surface-muted max-w-md leading-relaxed">
                {content.teamBody}
              </p>
            </div>
            <TeamCarousel members={team} />
          </Container>
        </Section>
      )}

      {/* Journey */}
      {milestones.length > 0 && (
        <Section>
          <Container>
            <div className="mb-10 flex flex-col gap-4 md:mb-14">
              <Eyebrow>Our journey</Eyebrow>
              <Heading size="h1">
                <AccentText text="How we *got here*" />
              </Heading>
            </div>
            <RevealGroup className="grid gap-px overflow-hidden rounded-[10px] border border-[var(--surface-rule)] bg-[var(--surface-rule)] sm:grid-cols-2 lg:grid-cols-4">
              {milestones.map((m) => (
                <RevealItem
                  key={`${m.year}-${m.title}`}
                  className="bg-canvas flex flex-col gap-3 p-6 md:p-8"
                >
                  <span className="text-brand font-[family-name:var(--font-accent)] text-5xl leading-none italic">
                    {m.year}
                  </span>
                  <h3 className="text-h3 mt-2">{m.title}</h3>
                  <p className="text-surface-muted text-sm leading-relaxed">
                    {m.description}
                  </p>
                </RevealItem>
              ))}
            </RevealGroup>
          </Container>
        </Section>
      )}

      {/* Values */}
      {values.length > 0 && (
        <Section surface="white">
          <Container className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <div className="flex flex-col gap-5">
                <Eyebrow>{content.valuesLabel}</Eyebrow>
                <Heading size="h1">
                  <AccentText text={autoAccent(content.valuesTitle)} />
                </Heading>
                <p className="text-surface-muted text-lg leading-relaxed">
                  {content.valuesBody}
                </p>
                <Button href="/contact" arrow className="mt-2 self-start">
                  Talk to us
                </Button>
              </div>
            </div>
            <ol className="flex flex-col">
              {values.map((v, i) => (
                <li
                  key={v.title}
                  className="border-surface-rule grid grid-cols-[4rem_1fr] gap-5 border-b py-8 first:pt-0 md:grid-cols-[5rem_1fr] md:gap-8"
                >
                  <span className="text-brand flex size-16 items-center justify-center md:size-20">
                    <AboutIcon name={v.icon} className="size-12 md:size-14" />
                  </span>
                  <div className="flex flex-col gap-2">
                    <p className="text-eyebrow text-surface-muted">
                      Value {String(i + 1).padStart(2, "0")}
                    </p>
                    <h3 className="text-h3">{v.title}</h3>
                    <p className="text-surface-muted leading-relaxed">
                      {v.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Container>
        </Section>
      )}

      {/* Our space */}
      {spaceImages.length > 0 && (
        <Section>
          <Container>
            <div className="mb-10 flex flex-col gap-6 md:mb-14 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex max-w-3xl flex-col gap-4">
                <Eyebrow>{content.spaceLabel}</Eyebrow>
                <Heading size="h1">
                  <AccentText text={autoAccent(content.spaceTitle)} />
                </Heading>
              </div>
              <p className="text-surface-muted max-w-md leading-relaxed">
                {content.spaceBody}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-4 md:grid-rows-2">
              {spaceImages.slice(0, 4).map((s, i) => (
                <figure
                  key={s.title}
                  className={
                    i === 0
                      ? "relative flex min-h-[18rem] flex-col justify-end overflow-hidden rounded-[10px] md:col-span-2 md:row-span-2 md:min-h-[32rem]"
                      : i === 3
                        ? "relative flex min-h-[14rem] flex-col justify-end overflow-hidden rounded-[10px] md:col-span-2"
                        : "relative flex min-h-[14rem] flex-col justify-end overflow-hidden rounded-[10px]"
                  }
                >
                  <MediaAsset
                    media={{ kind: "image", src: s.src, alt: s.title }}
                    sizes={
                      i === 0
                        ? "(min-width: 768px) 50vw, 100vw"
                        : "(min-width: 768px) 25vw, 100vw"
                    }
                    fallbackSrc={s.fallback}
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-[#00042f]/80 via-transparent to-transparent"
                  />
                  <figcaption className="relative p-5 text-white">
                    <p className="font-bold">{s.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-white/80">
                      {s.description}
                    </p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </Container>
        </Section>
      )}

      <TestimonialsCarousel items={home.testimonials} />

      <ClosingCta
        title={autoAccent(content.ctaTitle)}
        body={content.ctaBody}
        image={stock(STOCK.teamCafe, 2000)}
        whatsappHref={whatsapp}
        primary={{ label: "Talk to us", href: "/contact" }}
      />
    </main>
  );
}
