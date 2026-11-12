import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CataloguePageView } from "@/components/site/catalogue/catalogue-page-view";
import { formatMoney } from "@/lib/site/currency";
import { getCatalogueItem, getCatalogues } from "@/lib/site/catalogue-store";

type Params = { slug: string; item: string };
type Search = Record<string, string | string[] | undefined>;

export const dynamicParams = true;

export async function generateStaticParams(): Promise<Params[]> {
  return (await getCatalogues()).flatMap((c) =>
    c.items.map((i) => ({ slug: c.slug, item: i.slug })),
  );
}

/** Shareable item link: good titles and preview images for WhatsApp/social. */
export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug, item } = await params;
  const found = await getCatalogueItem(slug, item);
  if (!found) return {};
  const { catalogue, item: it } = found;
  const image =
    it.media.find((m) => m.kind === "image")?.src ?? catalogue.image;
  const description = `${formatMoney(it.price, "NGN")} per ${it.unit} · minimum ${it.moq}. ${it.description}`;
  return {
    alternates: { canonical: `/catalogue/${slug}/${item}` },
    title: `${it.title} · ${catalogue.title}`,
    description,
    openGraph: { title: it.title, description, images: [{ url: image }] },
  };
}

/** The catalogue page with this item open in the viewer. */
export default async function CatalogueItemPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const [{ slug, item }, search] = await Promise.all([params, searchParams]);
  const found = await getCatalogueItem(slug, item);
  if (!found) notFound();
  return (
    <CataloguePageView
      catalogue={found.catalogue}
      search={search}
      initialItemSlug={found.item.slug}
    />
  );
}
