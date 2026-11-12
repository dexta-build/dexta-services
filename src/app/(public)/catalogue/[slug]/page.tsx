import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CataloguePageView } from "@/components/site/catalogue/catalogue-page-view";
import { getCatalogue, getCatalogues } from "@/lib/site/catalogue-store";

type Params = { slug: string };
type Search = Record<string, string | string[] | undefined>;

export async function generateStaticParams(): Promise<Params[]> {
  return (await getCatalogues()).map((c) => ({ slug: c.slug }));
}

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const catalogue = await getCatalogue(slug);
  if (!catalogue) return {};
  return {
    alternates: { canonical: `/catalogue/${slug}` },
    title: `${catalogue.title} catalogue`,
    description: `${catalogue.description.replace(/\.$/, "")}. Browse ${catalogue.items.length} designs and order on WhatsApp.`,
    openGraph: { images: [{ url: catalogue.image }] },
  };
}

export default async function CataloguePage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const [{ slug }, search] = await Promise.all([params, searchParams]);
  const catalogue = await getCatalogue(slug);
  if (!catalogue) notFound();
  return <CataloguePageView catalogue={catalogue} search={search} />;
}
