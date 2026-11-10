import type { Metadata } from "next";
import { ClosingCta } from "@/components/site/closing-cta";
import { AboutSplit } from "@/components/site/home/about-split";
import { CatalogueShowcase } from "@/components/site/home/catalogue-showcase";
import { ComparisonTable } from "@/components/site/home/comparison-table";
import { FeaturedWorks } from "@/components/site/home/featured-works";
import { HomeHero } from "@/components/site/home/home-hero";
import { LogoStrip } from "@/components/site/home/logo-strip";
import { ManifestoStatement } from "@/components/site/home/manifesto-statement";
import { OffersBand } from "@/components/site/home/offers-band";
import { ServiceCards } from "@/components/site/home/service-cards";
import { StatsBand } from "@/components/site/home/stats-band";
import { ServicesNetwork } from "@/components/site/home/services-network";
import { ProcessBento } from "@/components/site/home/process-bento";
import { DifferenceGrid } from "@/components/site/home/difference-grid";
import { ColourSplits } from "@/components/site/home/colour-splits";
import { TestimonialsCarousel } from "@/components/site/home/testimonials-carousel";
import { fetchContactPageContent, fetchContactSocialLinks } from "@/lib/api";
import { HOME_CLOSING } from "@/lib/site/home-content";
import { getHomeData } from "@/lib/site/home-data";
import { getOffers, notEnded } from "@/lib/site/offers-data";
import { getWorks } from "@/lib/site/works-data";
import { resolveWhatsAppHref } from "@/lib/site/whatsapp";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  const [home, contact, socials, works, offers] = await Promise.all([
    getHomeData(),
    fetchContactPageContent(),
    fetchContactSocialLinks(),
    getWorks(),
    getOffers(),
  ]);
  // Every dated offer that hasn't ended; the band filters by start/end
  // in the browser too, so a cached page never shows an expired offer.
  const datedOffers = notEnded(offers, Date.now()).filter((o) => o.endsAt);

  const whatsappHref = resolveWhatsAppHref(
    socials,
    contact.phones,
    "Hello Dexta, I'd like to start a project.",
  );

  return (
    <main className="dx-site">
      <HomeHero
        hero={home.hero}
        projects={home.heroProjects}
        whatsappHref={whatsappHref}
      />
      <LogoStrip brands={home.brands} />
      <ManifestoStatement text={home.manifesto} />
      <AboutSplit />
      <ServiceCards services={home.services} />
      <StatsBand />
      <ServicesNetwork />
      <FeaturedWorks
        works={works.slice(0, 6).map((w) => ({
          id: w.id,
          title: w.title,
          tags: w.tags,
          serviceLabel: w.category,
          media: w.media[0],
          href: `/works/${w.slug}`,
        }))}
      />
      <CatalogueShowcase />
      <OffersBand offers={datedOffers} serverNow={Date.now()} />
      <ComparisonTable />
      <TestimonialsCarousel items={home.testimonials} />
      <ProcessBento />
      <DifferenceGrid />
      <ColourSplits />
      <ClosingCta
        title={HOME_CLOSING.title}
        body={HOME_CLOSING.body}
        image={HOME_CLOSING.image}
        whatsappHref={whatsappHref}
      />
    </main>
  );
}
