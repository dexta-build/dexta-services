import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServicePageTemplate } from "@/components/site/services/service-page-template";
import { loadServicePage } from "@/lib/content/pages/services";
import { pageMetadata } from "@/lib/content/seo";
import { getWhatsApp } from "@/lib/content/site-settings";
import { getHomeData } from "@/lib/site/home-data";
import { PILLAR_KEYS, getServiceCatalog } from "@/lib/services/catalog";

type Params = { pillar: string };

export async function generateStaticParams() {
  try {
    return (await getServiceCatalog()).map((p) => ({ pillar: p.key }));
  } catch {
    return PILLAR_KEYS.map((pillar) => ({ pillar }));
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { pillar } = await params;
  const loaded = await loadServicePage(pillar);
  return loaded ? pageMetadata(loaded.def) : {};
}

export default async function PillarPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { pillar } = await params;
  const loaded = await loadServicePage(pillar);
  if (!loaded) notFound();

  const [home, whatsappHref] = await Promise.all([
    getHomeData(),
    getWhatsApp("servicePillar", { service: loaded.page.shortName }),
  ]);

  return (
    <ServicePageTemplate
      page={loaded.page}
      hidden={loaded.hidden}
      faqTitle={loaded.faqTitle}
      brands={home.brands}
      whatsappHref={whatsappHref}
      breadcrumbs={[
        { label: "Services", href: "/services" },
        { label: loaded.pillar.title, href: `/services/${pillar}` },
      ]}
    />
  );
}
