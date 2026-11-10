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
import { getCatalogues, type CatalogueData } from "@/lib/site/catalogue-data";
import { getWhatsAppHref } from "@/lib/site/page-context";
import { getRates } from "@/lib/site/rates";
import { STOCK, stock } from "@/lib/site/stock-media";

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
  const [rates, whatsappBase, ctaWhatsapp] = await Promise.all([
    getRates(),
    getWhatsAppHref(),
    getWhatsAppHref(
      `Hello Dexta, I'm looking at the ${catalogue.title} catalogue.`,
    ),
  ]);
  const filters = filtersFromSearch(catalogue, search);
  const others = getCatalogues().filter((c) => c.slug !== catalogue.slug);

  return (
    <CurrencyProvider rates={rates}>
      <main className="dx-site">
        <CatalogueHero catalogue={catalogue} />
        <CatalogueBrowser
          // Remount when the address filters change (e.g. a hero chip link).
          key={JSON.stringify(filters)}
          catalogue={catalogue}
          initialFilters={filters}
          initialItemSlug={initialItemSlug}
          whatsappBase={whatsappBase}
        />

        <Section surface="white">
          <Container>
            <div className="mb-10 flex flex-col gap-4 md:mb-12">
              <Eyebrow>More catalogues</Eyebrow>
              <Heading size="h1">
                Shop by <em>occasion</em>
              </Heading>
            </div>
            <CatalogueCards catalogues={others.slice(0, 3)} />
          </Container>
        </Section>

        <ClosingCta
          variant="card"
          title="Can't find *exactly what you want*?"
          body="Tell us your idea and we'll design something just for you."
          image={stock(STOCK.craftSupplies, 1800, 900)}
          whatsappHref={ctaWhatsapp}
        />
      </main>
    </CurrencyProvider>
  );
}
