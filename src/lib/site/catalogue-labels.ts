/**
 * Words on every catalogue page (hero, filters, order panel), edited in
 * Pages → Catalogue pages. These defaults are also the fallbacks the
 * components use, so this module stays safe on server and client.
 */

export const CATALOGUE_HERO_LABELS = {
  eyebrow: "Catalogue",
  title: "*{catalogue}* catalogue",
  line: "Pick a design, choose your quantity and order on WhatsApp.",
};

export const CATALOGUE_BROWSE_LABELS = {
  allLabel: "All",
  searchPlaceholder: "Search designs…",
  sortLabel: "Sort by",
  sortFeatured: "Featured",
  sortPriceAsc: "Price: low to high",
  sortPriceDesc: "Price: high to low",
  sortNewest: "Newest",
  priceLabel: "Price",
  anyPrice: "Any price",
  countOne: "{count} design",
  countMany: "{count} designs",
  inCategory: "in {category}",
  clearLabel: "Clear filters",
  emptyTitle: "No designs match those filters",
  emptyBody:
    "Try another category or price, or tell us what you need and we'll design it.",
  customTitle: "Can't find it? *We'll design it.*",
  customBody: "Tell us your idea and we'll create a design just for you.",
  customMessage: "Hello Dexta! I'd like a custom {catalogue} design.",
  customButton: "Ask on WhatsApp",
  customButtonNoWhatsApp: "Ask on our contact page",
};

export const CATALOGUE_ORDER_LABELS = {
  minimumLabel: "Minimum order",
  detailsLabel: "Details",
  quantityLabel: "Quantity",
  minimumNote: "Minimum {moq}.",
  roundUpNote: "We'll round up to the minimum.",
  totalLabel: "Estimated total",
  orderButton: "Order on WhatsApp",
  requestButton: "Request this item",
  priceNote:
    "Prices are estimates. We confirm the final price before production.",
  messageIntro: "Hello Dexta! I'd like to order:",
};

export type CatalogueBrowseLabels = typeof CATALOGUE_BROWSE_LABELS;
export type CatalogueOrderLabels = typeof CATALOGUE_ORDER_LABELS;

/** Replaces {name} placeholders. */
export function fill(text: string, vars: Record<string, string | number>) {
  return text.replace(/\{(\w+)\}/g, (m, k) =>
    k in vars ? String(vars[k]) : m,
  );
}
