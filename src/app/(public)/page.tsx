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
import { HOME_PAGE } from "@/lib/content/pages/home";
import { pageMetadata } from "@/lib/content/seo";
import { getWhatsApp } from "@/lib/content/site-settings";
import { loadPage } from "@/lib/content/store";
import { getHomeData, type HeroProject } from "@/lib/site/home-data";
import { getServiceCatalog, type CatalogPillar } from "@/lib/services/catalog";
import { mediaItemFor, stock } from "@/lib/site/stock-media";
import { getOffers, notEnded } from "@/lib/site/offers-data";
import { getWorks } from "@/lib/site/works-data";
import { getCatalogueShowcase } from "@/lib/site/catalogue-store";

const GROUP_LABEL: Record<string, string> = {
  DESIGN: "Design",
  BUILD: "Build",
  PRINT: "Print",
};

/** "Wedding · Invitation cards", or "Wedding · Print" without a service. */
function projectLabel(
  p: { group: string; service?: string | null; occasion?: string | null },
  catalog: CatalogPillar[],
) {
  const [pillar, slug] = (p.service ?? "").split("/");
  const group = catalog.find((g) => g.key === pillar);
  const service = slug
    ? group?.services.find((s) => s.slug === slug)
    : undefined;
  const what = service?.title ?? GROUP_LABEL[p.group] ?? "";
  return [p.occasion, what].filter(Boolean).join(" · ");
}

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(HOME_PAGE, { absoluteTitle: true });
}

export default async function Home() {
  const [
    home,
    { data: c, hidden },
    whatsappHref,
    works,
    offers,
    catalog,
    catalogueShowcase,
  ] = await Promise.all([
    getHomeData(),
    loadPage(HOME_PAGE),
    getWhatsApp("general"),
    getWorks(),
    getOffers(),
    getServiceCatalog(),
    getCatalogueShowcase(),
  ]);
  const show = (key: keyof typeof c) => !hidden[key];

  // Hero tiles: real projects from Works, or the hand-picked list.
  const picked: HeroProject[] = c.showcase.projects
    .filter((p) => p.images.length > 0)
    .map((p, i) => ({
      id: `showcase-${i}`,
      title: p.title,
      category: projectLabel(p, catalog),
      tags: p.tags,
      description: p.description,
      media: p.images.map((id) => mediaItemFor(id, p.title)),
    }));
  const heroProjects = (
    c.showcase.source === "works" && works.length > 0 ? works : picked
  ).slice(0, c.showcase.limit || 12);

  const testimonials = c.testimonials.items.map((t, i) => ({
    id: `t-${i}`,
    quote: t.quote,
    author: t.author,
    role: t.role ?? "",
    company: t.company ?? "",
    logo: t.logo ? stock(t.logo, 160) : null,
  }));
  // Every dated offer that hasn't ended; the band filters by start/end
  // in the browser too, so a cached page never shows an expired offer.
  const datedOffers = notEnded(offers, Date.now()).filter((o) => o.endsAt);

  return (
    <main className="dx-site">
      <HomeHero
        hero={c.hero}
        projects={heroProjects}
        whatsappHref={whatsappHref}
      />
      {show("logos") && <LogoStrip brands={home.brands} content={c.logos} />}
      {show("manifesto") && (
        <ManifestoStatement text={c.manifesto.text ?? ""} />
      )}
      {(show("about") || show("advantage")) && (
        <AboutSplit
          about={c.about}
          advantage={c.advantage}
          hideAbout={hidden.about}
          hideAdvantage={hidden.advantage}
        />
      )}
      {show("services") && <ServiceCards content={c.services} />}
      {show("stats") && <StatsBand content={c.stats} />}
      {show("network") && <ServicesNetwork content={c.network} />}
      {show("works") && (
        <FeaturedWorks
          content={c.works}
          works={works.slice(0, c.works.count || 6).map((w) => ({
            id: w.id,
            title: w.title,
            tags: w.tags,
            serviceLabel: w.category,
            media: w.media[0],
            href: `/works/${w.slug}`,
          }))}
        />
      )}
      {show("catalogue") && (
        <CatalogueShowcase
          catalogues={catalogueShowcase}
          content={c.catalogue}
        />
      )}
      {show("offers") && (
        <OffersBand
          offers={datedOffers}
          serverNow={Date.now()}
          content={c.offers}
        />
      )}
      {show("comparison") && <ComparisonTable content={c.comparison} />}
      {show("testimonials") && (
        <TestimonialsCarousel items={testimonials} content={c.testimonials} />
      )}
      {show("process") && <ProcessBento content={c.process} />}
      {show("difference") && <DifferenceGrid content={c.difference} />}
      {show("splits") && <ColourSplits items={c.splits.items} />}
      {show("closing") && (
        <ClosingCta content={c.closing} whatsappHref={whatsappHref} />
      )}
    </main>
  );
}
