"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ArrowUpRight, Images, Play, Search, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccentText } from "../accent-text";
import { Container } from "../container";
import { MediaAsset } from "../media-asset";
import { MediaViewer, type ViewerItem } from "../media-viewer";
import { CurrencySwitcher, Price, useCurrency } from "./currency";
import { OrderPanel, whatsAppWithText } from "./order-panel";
import type { Surface } from "../section";
import {
  CATALOGUE_BROWSE_LABELS,
  CATALOGUE_ORDER_LABELS,
  fill,
  type CatalogueBrowseLabels,
  type CatalogueOrderLabels,
} from "@/lib/site/catalogue-labels";
import type {
  CatalogueData,
  CatalogueItemData,
} from "@/lib/site/catalogue-data";

export type SortKey = "featured" | "price-asc" | "price-desc" | "newest";
export type PriceKey = "any" | "under-5k" | "5k-50k" | "50k-500k" | "over-500k";

const SORTS: { key: SortKey; label: keyof CatalogueBrowseLabels }[] = [
  { key: "featured", label: "sortFeatured" },
  { key: "price-asc", label: "sortPriceAsc" },
  { key: "price-desc", label: "sortPriceDesc" },
  { key: "newest", label: "sortNewest" },
];

/** Price bands in naira; labels are shown in the visitor's currency. */
const PRICE_BANDS: { key: PriceKey; min: number; max: number }[] = [
  { key: "any", min: 0, max: Infinity },
  { key: "under-5k", min: 0, max: 5000 },
  { key: "5k-50k", min: 5000, max: 50000 },
  { key: "50k-500k", min: 50000, max: 500000 },
  { key: "over-500k", min: 500000, max: Infinity },
];

/**
 * Pinterest-style pattern: tall and short cards alternate down each column,
 * and neighbouring columns start on opposite heights, so the grid forms a
 * staggered brick pattern. `h` is height ÷ width, used to balance columns.
 */
const TALL = [
  { cls: "aspect-[3/4]", h: 4 / 3 },
  { cls: "aspect-[2/3]", h: 3 / 2 },
];
const SHORT = [
  { cls: "aspect-square", h: 1 },
  { cls: "aspect-[5/4]", h: 4 / 5 },
];
function ratioFor(row: number, col: number) {
  const variant = Math.floor(row / 2) % 2;
  return (row + col) % 2 === 0 ? TALL[variant] : SHORT[variant];
}
/** Gap plus the text under a card on phones, as a share of card width. */
const CARD_EXTRA = 0.15;

/** Columns per breakpoint: 2 on phones, 3 from md, 4 from xl. */
const COLUMN_QUERIES: [string, number][] = [
  ["(min-width: 1280px)", 4],
  ["(min-width: 768px)", 3],
];
function readColumns() {
  return COLUMN_QUERIES.find(([q]) => window.matchMedia(q).matches)?.[1] ?? 2;
}
function subscribeColumns(onChange: () => void) {
  const lists = COLUMN_QUERIES.map(([q]) => window.matchMedia(q));
  lists.forEach((l) => l.addEventListener("change", onChange));
  return () => lists.forEach((l) => l.removeEventListener("change", onChange));
}
const noopSubscribe = () => () => {};

function useColumns() {
  return useSyncExternalStore(subscribeColumns, readColumns, () => 2);
}

export type CatalogueFilters = {
  category: string;
  query: string;
  sort: SortKey;
  price: PriceKey;
};

type CatalogueBrowserProps = {
  catalogue: CatalogueData;
  initialFilters: CatalogueFilters;
  /** Open this item on load (from /catalogue/[slug]/[item]). */
  initialItemSlug?: string;
  whatsappBase: string | null;
  labels?: CatalogueBrowseLabels;
  orderLabels?: CatalogueOrderLabels;
};

/**
 * Filter bar + Pinterest grid + item viewer for one catalogue. Filters and
 * the open item are mirrored in the address bar, so any view can be shared.
 */
export function CatalogueBrowser({
  catalogue,
  initialFilters,
  initialItemSlug,
  whatsappBase,
  labels: L = CATALOGUE_BROWSE_LABELS,
  orderLabels = CATALOGUE_ORDER_LABELS,
}: CatalogueBrowserProps) {
  const { format } = useCurrency();
  const [filters, setFilters] = useState<CatalogueFilters>(initialFilters);

  const filtered = useMemo(() => {
    const band =
      PRICE_BANDS.find((b) => b.key === filters.price) ?? PRICE_BANDS[0];
    const q = filters.query.trim().toLowerCase();
    const list = catalogue.items.filter(
      (it) =>
        (filters.category === "all" || it.category === filters.category) &&
        it.price >= band.min &&
        it.price < band.max &&
        (!q ||
          [it.title, it.category, it.description, ...it.tags]
            .join(" ")
            .toLowerCase()
            .includes(q)),
    );
    const sorted = [...list];
    if (filters.sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    else if (filters.sort === "price-desc")
      sorted.sort((a, b) => b.price - a.price);
    else if (filters.sort === "newest")
      sorted.sort((a, b) => b.createdAt - a.createdAt);
    else
      sorted.sort(
        (a, b) =>
          Number(b.featured) - Number(a.featured) || a.position - b.position,
      );
    return sorted;
  }, [catalogue.items, filters]);

  const [openSlug, setOpenSlug] = useState<string | null>(
    initialItemSlug ?? null,
  );
  // Which of the open item's images is showing.
  const [mediaIndex, setMediaIndex] = useState(0);
  const openItem = openSlug
    ? catalogue.items.find((it) => it.slug === openSlug)
    : undefined;
  const openItemAt = (slug: string) => {
    setMediaIndex(0);
    setOpenSlug(slug);
  };

  // Masonry like Pinterest: each design goes into the shortest column
  // (leftmost on ties, so the first row reads in sort order). The shortest
  // column then ends with the "We'll design it" tile, stretched to line up.
  const columns = useColumns();
  const { grid, ctaColumn } = useMemo(() => {
    const cols: { item: CatalogueItemData; ratio: string }[][] = Array.from(
      { length: columns },
      () => [],
    );
    const heights = Array<number>(columns).fill(0);
    filtered.forEach((item) => {
      const col = heights.indexOf(Math.min(...heights));
      const ratio = ratioFor(cols[col].length, col);
      cols[col].push({ item, ratio: ratio.cls });
      heights[col] += ratio.h + CARD_EXTRA;
    });
    return {
      grid: cols,
      ctaColumn: heights.indexOf(Math.min(...heights)),
    };
  }, [filtered, columns]);

  // Mirror filters and the open item in the URL without a page load.
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.category !== "all") params.set("category", filters.category);
    if (filters.query.trim()) params.set("q", filters.query.trim());
    if (filters.sort !== "featured") params.set("sort", filters.sort);
    if (filters.price !== "any") params.set("price", filters.price);
    const path = `/catalogue/${catalogue.slug}${openSlug ? `/${openSlug}` : ""}`;
    const qs = params.toString();
    const next = `${path}${qs ? `?${qs}` : ""}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", next);
    }
  }, [filters, openSlug, catalogue.slug]);

  const update = (patch: Partial<CatalogueFilters>) =>
    setFilters((f) => ({ ...f, ...patch }));

  // The viewer shows only the open item and its own images/videos.
  const viewerItems: ViewerItem[] = openItem
    ? (openItem.media.length
        ? openItem.media
        : [{ kind: "image" as const, src: catalogue.image, alt: "" }]
      ).map((m, i) => ({ ...m, id: `${openItem.id}-${i}` }))
    : [];

  // Site origin for share links; empty during server render (no mismatch).
  const origin = useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => "",
  );
  const hasFilters =
    filters.category !== "all" ||
    filters.query.trim() !== "" ||
    filters.price !== "any";

  return (
    <section
      data-surface="canvas"
      className="bg-surface text-surface-fg pb-16 md:pb-24"
    >
      {/* Filter bar: pinned under the header while browsing */}
      <div className="bg-surface/95 border-surface-rule sticky top-14 z-30 border-b backdrop-blur xl:top-[78px]">
        <Container className="flex flex-col gap-3 py-3 md:py-4">
          <div
            role="tablist"
            aria-label="Categories"
            className="dx-no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0"
          >
            {["all", ...catalogue.categories].map((cat) => {
              const active = filters.category === cat;
              const count =
                cat === "all"
                  ? catalogue.items.length
                  : catalogue.items.filter((i) => i.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => update({ category: cat })}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm whitespace-nowrap transition-colors",
                    active
                      ? "bg-surface-fg text-surface border-transparent"
                      : "border-surface-fg/20 hover:border-surface-fg",
                  )}
                >
                  {cat === "all" ? L.allLabel : cat}
                  <span
                    className={cn(
                      "text-xs tabular-nums",
                      active ? "opacity-70" : "text-surface-muted",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2 md:flex md:items-center md:gap-3">
            <label className="border-surface-fg/20 focus-within:border-surface-fg col-span-2 flex h-11 items-center gap-2 rounded-full border px-4 md:w-72">
              <Search
                aria-hidden
                className="text-surface-muted size-4 shrink-0"
              />
              <span className="sr-only">Search this catalogue</span>
              <input
                type="search"
                value={filters.query}
                onChange={(e) => update({ query: e.target.value })}
                placeholder={L.searchPlaceholder}
                className="w-full bg-transparent text-sm outline-none"
              />
            </label>
            <Select
              label={L.sortLabel}
              value={filters.sort}
              onChange={(v) => update({ sort: v as SortKey })}
              options={SORTS.map((s) => ({ value: s.key, label: L[s.label] }))}
            />
            <Select
              label={L.priceLabel}
              value={filters.price}
              onChange={(v) => update({ price: v as PriceKey })}
              options={PRICE_BANDS.map((b) => ({
                value: b.key,
                label:
                  b.key === "any"
                    ? L.anyPrice
                    : b.max === Infinity
                      ? `Over ${format(b.min)}`
                      : b.min === 0
                        ? `Under ${format(b.max)}`
                        : `${format(b.min)} – ${format(b.max)}`,
              }))}
            />
            <CurrencySwitcher className="col-span-2 justify-self-start md:ml-auto" />
          </div>
        </Container>
      </div>

      <Container className="pt-6 md:pt-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <p className="text-surface-muted text-sm" aria-live="polite">
            {fill(filtered.length === 1 ? L.countOne : L.countMany, {
              count: filtered.length,
            })}
            {filters.category !== "all" &&
              ` ${fill(L.inCategory, { category: filters.category })}`}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={() =>
                update({ category: "all", query: "", price: "any" })
              }
              className="inline-flex items-center gap-1 text-sm font-bold"
            >
              <X className="size-4" /> {L.clearLabel}
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="border-surface-rule rounded-[10px] border border-dashed px-6 py-16 text-center">
            <p className="text-h3">{L.emptyTitle}</p>
            <p className="text-surface-muted mt-2 text-sm">{L.emptyBody}</p>
          </div>
        ) : (
          <div className="flex gap-3 md:gap-4 xl:gap-5">
            {grid.map((col, c) => (
              <div
                key={c}
                className="flex min-w-0 flex-1 flex-col gap-3 md:gap-4 xl:gap-5"
              >
                {col.map(({ item, ratio }, r) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    ratio={ratio}
                    stretch={c !== ctaColumn && r === col.length - 1}
                    surface={catalogue.surface}
                    onOpen={() => openItemAt(item.slug)}
                  />
                ))}
                {c === ctaColumn && (
                  <CustomDesignTile
                    catalogueTitle={catalogue.title}
                    surface={catalogue.surface}
                    whatsappBase={whatsappBase}
                    labels={L}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </Container>

      <MediaViewer
        items={viewerItems}
        index={openItem ? Math.min(mediaIndex, viewerItems.length - 1) : null}
        onIndexChange={(i) => {
          if (i === null) setOpenSlug(null);
          else setMediaIndex(i);
        }}
        label={openItem ? openItem.title : `${catalogue.title} catalogue`}
        thumbnailsOnMobile
        renderDetails={() =>
          openItem ? (
            <OrderPanel
              key={openItem.id}
              item={openItem}
              catalogueTitle={catalogue.title}
              itemUrl={`${origin}/catalogue/${catalogue.slug}/${openItem.slug}`}
              whatsappBase={whatsappBase}
              labels={orderLabels}
            />
          ) : null
        }
      />
    </section>
  );
}

/**
 * A design in the grid. Phones and tablets show the title, price and MOQ
 * under the image. On laptops and desktops the image stands alone and a
 * panel in the catalogue's colour slides up on hover (or keyboard focus)
 * with the description, price and MOQ, like the homepage service cards.
 */
function ItemCard({
  item,
  ratio,
  surface,
  onOpen,
  stretch = false,
}: {
  item: CatalogueItemData;
  ratio: string;
  surface: Surface;
  onOpen: () => void;
  /** Grow to fill the column, so the grid ends flush. */
  stretch?: boolean;
}) {
  const media = item.media[0];
  const count = item.media.length;
  return (
    <button
      type="button"
      onClick={onOpen}
      data-cursor="View"
      aria-label={`${item.title}, ${item.category}`}
      className={cn(
        "group block w-full text-left outline-none",
        stretch && "flex flex-1 flex-col",
      )}
    >
      <span
        className={cn(
          "bg-surface-fg/5 group-focus-visible:ring-brand-cyan relative block overflow-hidden rounded-[10px] transition-[transform,box-shadow] duration-500 ease-(--ease-out-expo) group-focus-visible:ring-2 lg:group-hover:-translate-y-1.5 lg:group-hover:shadow-xl lg:group-focus-visible:-translate-y-1.5",
          ratio,
          stretch && "flex-1",
        )}
      >
        {media && (
          <span className="absolute inset-0 transition-transform duration-700 ease-(--ease-out-expo) group-hover:scale-105">
            <MediaAsset
              media={media}
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
            />
          </span>
        )}

        <span className="absolute top-2.5 left-2.5 flex gap-1.5">
          {item.featured && (
            <span className="bg-brand-cyan text-royal rounded-full px-2.5 py-1 text-[0.6875rem] font-bold">
              Featured
            </span>
          )}
          {media?.kind === "video" && (
            <span className="bg-royal/70 text-ice inline-flex size-7 items-center justify-center rounded-full backdrop-blur">
              <Play className="size-3.5 fill-current" />
            </span>
          )}
        </span>
        {count > 1 && (
          <span className="bg-royal/70 text-ice absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.6875rem] font-bold backdrop-blur">
            <Images aria-hidden className="size-3.5" />
            {count}
            <span className="sr-only">images</span>
          </span>
        )}

        {/* Hover panel (laptops and up) */}
        <span
          data-surface={surface}
          className="bg-surface text-surface-fg absolute inset-x-2 bottom-2 hidden translate-y-[calc(100%+0.5rem)] flex-col gap-1.5 rounded-[8px] p-4 opacity-0 shadow-lg transition-[transform,opacity] duration-500 ease-(--ease-out-expo) group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 lg:flex"
        >
          <span className="text-surface-muted text-[0.6875rem] font-bold tracking-[0.08em] uppercase">
            {item.category}
          </span>
          <span className="text-[0.9375rem] leading-snug font-bold">
            {item.title}
          </span>
          {item.description && (
            <span className="text-surface-muted line-clamp-2 text-xs leading-relaxed">
              {item.description}
            </span>
          )}
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <Price ngn={item.price} className="text-sm font-bold" />
            <span className="text-surface-muted text-xs">/ {item.unit}</span>
            <span className="bg-surface-fg/10 ml-auto rounded-full px-2 py-0.5 text-[0.6875rem] font-bold">
              MOQ {item.moq}
            </span>
          </span>
        </span>
      </span>

      {/* Details under the image (phones and tablets) */}
      <span className="mt-2.5 block lg:hidden">
        <span className="block text-sm leading-snug font-bold">
          {item.title}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <Price ngn={item.price} className="text-sm font-bold" />
          <span className="text-surface-muted text-xs">/ {item.unit}</span>
          <span className="bg-surface-fg/8 rounded-full px-2 py-0.5 text-[0.6875rem] font-bold">
            MOQ {item.moq}
          </span>
        </span>
      </span>
    </button>
  );
}

/**
 * Closes the shortest grid column in the catalogue's colour, so the grid
 * ends flush and offers a custom design when nothing quite fits.
 */
function CustomDesignTile({
  catalogueTitle,
  surface,
  whatsappBase,
  labels: L,
}: {
  catalogueTitle: string;
  surface: Surface;
  whatsappBase: string | null;
  labels: CatalogueBrowseLabels;
}) {
  const href = whatsappBase
    ? whatsAppWithText(
        whatsappBase,
        fill(L.customMessage, { catalogue: catalogueTitle.toLowerCase() }),
      )
    : "/contact";
  return (
    <a
      href={href}
      target={whatsappBase ? "_blank" : undefined}
      rel={whatsappBase ? "noopener noreferrer" : undefined}
      data-surface={surface}
      data-cursor="Ask us"
      className="group bg-surface text-surface-fg flex min-h-52 flex-1 flex-col justify-between gap-6 rounded-[10px] p-5 md:p-6"
    >
      <Sparkles aria-hidden className="size-6" />
      <span className="flex flex-col gap-2">
        <span className="dx-heading text-h3 leading-tight">
          <AccentText text={L.customTitle} />
        </span>
        <span className="text-surface-muted text-sm leading-relaxed">
          {L.customBody}
        </span>
        <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold">
          {whatsappBase ? L.customButton : L.customButtonNoWhatsApp}
          <ArrowUpRight
            aria-hidden
            className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </span>
      </span>
    </a>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="border-surface-fg/20 focus-within:border-surface-fg relative flex h-11 min-w-0 items-center rounded-full border pr-3 pl-4">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 cursor-pointer appearance-none bg-transparent pr-5 text-sm outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span
        aria-hidden
        className="text-surface-muted pointer-events-none absolute right-4 text-xs"
      >
        ▾
      </span>
    </label>
  );
}
