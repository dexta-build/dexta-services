import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServicePageTemplate } from "@/components/site/services/service-page-template";
import { loadServicePage } from "@/lib/content/pages/services";
import { pageMetadata } from "@/lib/content/seo";
import { getWhatsApp } from "@/lib/content/site-settings";
import { getHomeData } from "@/lib/site/home-data";
import { SERVICES } from "@/lib/site/services-content";
import { getServiceCatalog } from "@/lib/services/catalog";

type Params = { pillar: string; service: string };

export async function generateStaticParams() {
  try {
    return (await getServiceCatalog()).flatMap((p) =>
      p.services
        .filter((s) => !s.externalHref)
        .map((s) => ({ pillar: p.key, service: s.slug })),
    );
  } catch {
    return SERVICES.map((s) => ({ pillar: s.pillar, service: s.slug }));
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { pillar, service } = await params;
  const loaded = await loadServicePage(pillar, service);
  return loaded ? pageMetadata(loaded.def) : {};
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { pillar, service } = await params;
  const loaded = await loadServicePage(pillar, service);
  if (!loaded?.service) notFound();

  const [home, whatsappHref] = await Promise.all([
    getHomeData(),
    getWhatsApp("service", { service: loaded.page.shortName }),
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
        {
          label: loaded.service.title,
          href: `/services/${pillar}/${service}`,
        },
      ]}
      related={loaded.related}
    />
  );
}
