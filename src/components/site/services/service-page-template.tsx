import { ClosingCta } from "../closing-cta";
import { LogoStrip } from "../home/logo-strip";
import type { HomeBrand } from "@/lib/site/home-data";
import type { Offering, ServicePage } from "@/lib/site/services-content";
import { stock } from "@/lib/site/stock-media";
import { FaqSection } from "./faq-section";
import { OfferingsBento } from "./offerings-bento";
import { ProblemSplit } from "./problem-split";
import { ProcessTimeline } from "./process-timeline";
import { QualityCard } from "./quality-card";
import { RelatedServices } from "./related-services";
import { ServiceHero } from "./service-hero";
import { TechStack } from "./tech-stack";
import { TrustStats } from "./trust-stats";
import { UseCases } from "./use-cases";

type ServicePageTemplateProps = {
  page: ServicePage;
  breadcrumbs: { label: string; href: string }[];
  brands: HomeBrand[];
  whatsappHref: string | null;
  related?: { title: string; items: Offering[] };
};

/**
 * One template for every service page (pillar or individual service), in
 * Superside's order: hero, logos, problem, trust, offerings, [tech stack],
 * use cases, quality, process, closing CTA, related services, FAQs.
 */
export function ServicePageTemplate({
  page,
  breadcrumbs,
  brands,
  whatsappHref,
  related,
}: ServicePageTemplateProps) {
  return (
    <main className="dx-site">
      <ServiceHero
        {...page.hero}
        breadcrumbs={breadcrumbs}
        whatsappHref={whatsappHref}
      />
      <LogoStrip brands={brands} />
      <ProblemSplit {...page.problem} />
      <TrustStats {...page.trust} />
      <OfferingsBento {...page.offerings} />
      {page.techStack && <TechStack {...page.techStack} />}
      <UseCases {...page.useCases} />
      <QualityCard {...page.quality} />
      <ProcessTimeline {...page.process} />
      <ClosingCta
        variant="card"
        title={page.closing.title}
        body={page.closing.body}
        image={stock(page.closing.image, 1800, 900)}
        whatsappHref={whatsappHref}
      />
      {related && (
        <RelatedServices title={related.title} items={related.items} />
      )}
      <FaqSection
        title={`Your *${page.shortName}* questions, answered`}
        faqs={page.faqs}
      />
    </main>
  );
}
