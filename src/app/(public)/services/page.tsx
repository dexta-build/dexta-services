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
import { HOME_ADVANTAGE } from "@/lib/site/home-content";
import { getHomeData } from "@/lib/site/home-data";
import { getWhatsAppHref } from "@/lib/site/page-context";
import { SERVICES_HUB } from "@/lib/site/services-content";
import { SHOWREEL_VIDEO, STOCK, stock } from "@/lib/site/stock-media";

export const metadata: Metadata = {
  alternates: { canonical: "/services" },
  title: "Services",
  description:
    "Design, software engineering and print services from one creative team in Port Harcourt, Nigeria.",
};

export default async function ServicesPage() {
  const [home, whatsappHref] = await Promise.all([
    getHomeData(),
    getWhatsAppHref("Hello Dexta, I'd like to talk about your services."),
  ]);
  const { hero, intro, faqs } = SERVICES_HUB;

  return (
    <main className="dx-site">
      <ServiceHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        body={hero.body}
        image={hero.image}
        whatsappHref={whatsappHref}
        chips={[
          { label: "Brand identity", image: STOCK.colourSwatches },
          { label: "Websites", image: STOCK.laptopBrowsing },
          { label: "Invitation cards", image: STOCK.weddingRings },
          { label: "Mobile apps", image: STOCK.phoneAppUi },
          { label: "Packaging", image: STOCK.craftSupplies },
          { label: "Signage", image: STOCK.eventStage },
          { label: "E-commerce", image: STOCK.shoppingLaptopPhone },
          { label: "Merchandise", image: STOCK.whiteTshirt },
        ]}
      />
      <LogoStrip brands={home.brands} />

      {/* Intro: copy beside the showreel teaser */}
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
              words={HOME_ADVANTAGE.teaserWords}
              images={HOME_ADVANTAGE.teaserImages.map((id) =>
                stock(id, 700, 700),
              )}
              video={SHOWREEL_VIDEO}
            />
          </Reveal>
        </Container>
      </Section>

      <PillarBands />
      <div className="pt-16 md:pt-24 xl:pt-32">
        <DifferenceGrid />
      </div>
      <FaqSection title="Questions about *working with us*" faqs={faqs} />
      <ClosingCta
        title="Have a project in mind? *Let's make it happen*"
        body="Tell us what you're planning. We'll take it from idea to finished piece."
        image={stock(STOCK.teamWhiteboard, 2000)}
        whatsappHref={whatsappHref}
      />
    </main>
  );
}
