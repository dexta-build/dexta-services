import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServicePageTemplate } from "@/components/site/services/service-page-template";
import { getHomeData } from "@/lib/site/home-data";
import { getWhatsAppHref } from "@/lib/site/page-context";
import {
  getPillar,
  PILLARS,
  type PillarKey,
} from "@/lib/site/services-content";
import { SERVICE_GROUPS } from "@/lib/site/navigation";

type Params = { pillar: string };

export function generateStaticParams(): Params[] {
  return (Object.keys(PILLARS) as PillarKey[]).map((pillar) => ({ pillar }));
}

const plain = (text: string) => text.replace(/\*/g, "");

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { pillar } = await params;
  const page = getPillar(pillar);
  if (!page) return {};
  return {
    alternates: { canonical: `/services/${pillar}` },
    title: page.hero.eyebrow,
    description: plain(page.hero.body),
  };
}

export default async function PillarPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { pillar } = await params;
  const page = getPillar(pillar);
  if (!page) notFound();

  const group = SERVICE_GROUPS.find((g) => g.key === pillar);
  const [home, whatsappHref] = await Promise.all([
    getHomeData(),
    getWhatsAppHref(
      `Hello Dexta, I'd like to talk about ${page.shortName} services.`,
    ),
  ]);

  return (
    <ServicePageTemplate
      page={page}
      brands={home.brands}
      whatsappHref={whatsappHref}
      breadcrumbs={[
        { label: "Services", href: "/services" },
        {
          label: group?.title ?? page.hero.eyebrow,
          href: `/services/${pillar}`,
        },
      ]}
    />
  );
}
