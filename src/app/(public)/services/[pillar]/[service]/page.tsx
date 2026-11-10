import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServicePageTemplate } from "@/components/site/services/service-page-template";
import { getHomeData } from "@/lib/site/home-data";
import { getWhatsAppHref } from "@/lib/site/page-context";
import { SERVICE_GROUPS } from "@/lib/site/navigation";
import {
  getService,
  PILLARS,
  SERVICES,
  servicesInPillar,
} from "@/lib/site/services-content";

type Params = { pillar: string; service: string };

export function generateStaticParams(): Params[] {
  return SERVICES.map((s) => ({ pillar: s.pillar, service: s.slug }));
}

const plain = (text: string) => text.replace(/\*/g, "");

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { pillar, service } = await params;
  const page = getService(pillar, service);
  if (!page) return {};
  return {
    alternates: { canonical: `/services/${pillar}/${service}` },
    title: page.hero.eyebrow,
    description: plain(page.hero.body),
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { pillar, service } = await params;
  const page = getService(pillar, service);
  if (!page) notFound();

  const group = SERVICE_GROUPS.find((g) => g.key === pillar);
  const [home, whatsappHref] = await Promise.all([
    getHomeData(),
    getWhatsAppHref(`Hello Dexta, I'd like to talk about ${page.shortName}.`),
  ]);

  // Sibling services in the same pillar, as photo cards.
  const related = PILLARS[page.pillar].offerings.items.filter(
    (item) => item.href !== `/services/${pillar}/${service}`,
  );
  const siblingsExist = servicesInPillar(page.pillar).length > 1;

  return (
    <ServicePageTemplate
      page={page}
      brands={home.brands}
      whatsappHref={whatsappHref}
      breadcrumbs={[
        { label: "Services", href: "/services" },
        { label: group?.title ?? pillar, href: `/services/${pillar}` },
        { label: page.hero.eyebrow, href: `/services/${pillar}/${service}` },
      ]}
      related={
        siblingsExist
          ? {
              title: `Explore more *${page.pillar}* services`,
              items: related,
            }
          : undefined
      }
    />
  );
}
