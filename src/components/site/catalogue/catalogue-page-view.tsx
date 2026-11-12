import { CATALOGUE_TEMPLATE } from "@/lib/content/pages/templates";
import { loadPage } from "@/lib/content/store";
import { ClosingCta } from "../closing-cta";
import { Container } from "../container";
import { Eyebrow } from "../eyebrow";
import { Heading } from "../heading";
import { Section } from "../section";
import {
  CatalogueBrowser,
  type CatalogueFilters,
  type PriceKey,
  type SortKey,
} from "./catalogue-browser";
import { CatalogueCards } from "./catalogue-cards";
import { CatalogueHero } from "./catalogue-hero";
import { CurrencyProvider } from "./currency";
import type { CatalogueData } from "@/lib/site/catalogue-data";
import { getCatalogues } from "@/lib/site/catalogue-store";
import { AccentText } from "../accent-text";
import { getWhatsApp } from "@/lib/content/site-settings";
import { getWhatsAppHref } from "@/lib/site/page-context";
import { getRates } from "@/lib/site/rates";

const SORTS: SortKey[] = ["featured", "price-asc", "price-desc", "newest"];
const PRICES: PriceKey[] = [
  "any",
  "under-5k",
  "5k-50k",
  "50k-500k",
  "over-500k",
];

type Search = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export function filtersFromSearch(
  catalogue: CatalogueData,
  search: Search,
): CatalogueFilters {
  const category = one(search.category);
  const sort = one(search.sort) as SortKey | undefined;
  const price = one(search.price) as PriceKey | undefined;
  return {
    category:
      category && catalogue.categories.includes(category) ? category : "all",
    query: one(search.q) ?? "",
    sort: sort && SORTS.includes(sort) ? sort : "featured",
    price: price && PRICES.includes(price) ? price : "any",
  };
}

/** Shared view for /catalogue/[slug] and /catalogue/[slug]/[item]. */
export async function CataloguePageView({
  catalogue,
  search,
  initialItemSlug,
}: {
  catalogue: CatalogueData;
  search: Search;
  initialItemSlug?: string;
}) {
  const [rates, whatsappBase, ctaWhatsapp, all, template] = await Promise.all([
    getRates(),
    getWhatsAppHref(),
    getWhatsApp("catalogue", { catalogue: catalogue.title }),
    getCatalogues(),
    loadPage(CATALOGUE_TEMPLATE),
  ]);
  const { data: templateContent, hidden } = template;
  const filters = filtersFromSearch(catalogue, search);
  const others = all.filter((c) => c.slug !== catalogue.slug);
  const more = templateContent.more;
  return (
    <CurrencyProvider rates={rates}>
      <main className="dx-site">
        <CatalogueHero catalogue={catalogue} labels={templateContent.hero} />
        <CatalogueBrowser
          // Remount when the address filters change (e.g. a hero chip link).
          key={JSON.stringify(filters)}
          catalogue={catalogue}
          initialFilters={filters}
          initialItemSlug={initialItemSlug}
          whatsappBase={whatsappBase}
          labels={templateContent.browse}
          orderLabels={templateContent.order}
        />

        {!hidden.more && others.length > 0 && (
          <Section surface="white">
            <Container>
              <div className="mb-10 flex flex-col gap-4 md:mb-12">
                {more.eyebrow && <Eyebrow>{more.eyebrow}</Eyebrow>}
                <Heading size="h1">
                  <AccentText text={more.title} />
                </Heading>
              </div>
              <CatalogueCards catalogues={others.slice(0, more.count || 3)} />
            </Container>
          </Section>
        )}

        {!hidden.closing && (
          <ClosingCta
            content={templateContent.closing}
            variant="card"
            whatsappHref={ctaWhatsapp}
          />
        )}
      </main>
    </CurrencyProvider>
  );
}
