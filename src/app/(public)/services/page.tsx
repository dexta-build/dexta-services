import type { Metadata } from "next";
import { AccentText } from "@/components/site/accent-text";
import { ClosingCta } from "@/components/site/closing-cta";
import { Container } from "@/components/site/container";
import { Eyebrow } from "@/components/site/eyebrow";
import { Heading } from "@/components/site/heading";
import { DifferenceGrid } from "@/components/site/home/difference-grid";
import { LogoStrip } from "@/components/site/home/logo-strip";
import { ShowreelTeaser } from "@/components/site/home/showreel-teaser";
import { Reveal } from "@/components/site/reveal";
import { Section } from "@/components/site/section";
import { FaqSection } from "@/components/site/services/faq-section";
import { PillarBands } from "@/components/site/services/pillar-bands";
import { ServiceHero } from "@/components/site/services/service-hero";
import { SERVICES_PAGE } from "@/lib/content/pages/main";
import { pageMetadata } from "@/lib/content/seo";
import { getWhatsApp } from "@/lib/content/site-settings";
import { loadPage } from "@/lib/content/store";
import { getHomeData } from "@/lib/site/home-data";
import { getServiceCatalog, serviceCards } from "@/lib/services/catalog";
import { stock } from "@/lib/site/stock-media";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(SERVICES_PAGE);
}

export default async function ServicesPage() {
  const [home, { data: c, hidden }, whatsappHref, catalog] = await Promise.all([
    getHomeData(),
    loadPage(SERVICES_PAGE),
    getWhatsApp("services"),
    getServiceCatalog(),
  ]);
  const bands = catalog.map((p) => ({
    key: p.key,
    title: p.title,
    items: serviceCards(p),
  }));
  const { hero, intro } = c;

  return (
    <main className="dx-site">
      <ServiceHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        body={hero.body}
        image={hero.image}
        whatsappHref={whatsappHref}
        chips={hero.chips}
      />
      <LogoStrip brands={home.brands} />

      {/* Intro: copy beside the showreel teaser */}
      {!hidden.intro && (
        <Section>
          <Container className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16 xl:gap-24">
            <Reveal className="flex flex-col gap-6">
              <Eyebrow rule>{intro.eyebrow}</Eyebrow>
              <Heading size="h1">
                <AccentText text={intro.title} />
              </Heading>
              <p className="text-lead">{intro.lead}</p>
              <p className="text-surface-muted leading-relaxed">{intro.body}</p>
            </Reveal>
            <Reveal>
              <ShowreelTeaser
                words={intro.words}
                images={intro.images.map((id) => stock(id, 700, 700))}
                video={intro.video}
              />
            </Reveal>
          </Container>
        </Section>
      )}

      {!hidden.groups && <PillarBands groups={c.groups} pillars={bands} />}
      {!hidden.difference && (
        <div className="pt-16 md:pt-24 xl:pt-32">
          <DifferenceGrid content={c.difference} />
        </div>
      )}
      {!hidden.faq && <FaqSection title={c.faq.title} faqs={c.faq.items} />}
      {!hidden.closing && (
        <ClosingCta content={c.closing} whatsappHref={whatsappHref} />
      )}
    </main>
  );
}
