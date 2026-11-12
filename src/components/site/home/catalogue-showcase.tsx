"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { AccentText } from "../accent-text";
import { Button } from "../button";
import { Container } from "../container";
import { Eyebrow } from "../eyebrow";
import { Heading } from "../heading";
import { NavIcon } from "../shell/nav-icon";
import { HOME_CATALOGUE } from "@/lib/site/home-content";
import type { ShowcaseCatalogue } from "@/lib/site/catalogue-data";

/** Tile heights for a Pinterest-style rhythm in the preview grid. */
const TILE_RATIOS = [
  "aspect-[3/4]",
  "aspect-square",
  "aspect-[4/5]",
  "aspect-[4/5]",
  "aspect-[3/4]",
  "aspect-square",
];

/**
 * "Pick a catalogue": tabs across the top; the section takes on the chosen
 * catalogue's colour, and a preview grid shows its categories.
 * Catalogues (and which show here) come from the Catalogues screen; each
 * tile is a category with the first image of a design in it.
 */
export function CatalogueShowcase({
  catalogues,
  content = HOME_CATALOGUE,
}: {
  catalogues: ShowcaseCatalogue[];
  content?: typeof HOME_CATALOGUE & { buttonLabel?: string };
}) {
  const [activeSlug, setActiveSlug] = useState(catalogues[0]?.slug);
  const active = catalogues.find((c) => c.slug === activeSlug) ?? catalogues[0];
  if (!active) return null;
  const tiles = active.tiles.filter((t) => t.image);

  return (
    <section
      data-surface={active.surface}
      className="bg-surface text-surface-fg py-16 transition-colors duration-500 md:py-24 xl:py-32"
    >
      <Container>
        <div className="grid gap-8 xl:grid-cols-[1fr_1.4fr] xl:gap-16">
          <div className="flex min-w-0 flex-col gap-5">
            <Eyebrow rule>{content.eyebrow}</Eyebrow>
            <Heading size="h1">
              <AccentText text={content.title} />
            </Heading>
            <p className="text-surface-muted max-w-md leading-relaxed">
              {content.body}
            </p>

            <div
              role="tablist"
              aria-label="Catalogues"
              className="dx-no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0"
            >
              {catalogues.map((c) => {
                const selected = c.slug === active.slug;
                return (
                  <button
                    key={c.slug}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveSlug(c.slug)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm whitespace-nowrap transition-colors",
                      selected
                        ? "bg-surface-fg text-surface border-transparent"
                        : "border-surface-fg/25 hover:border-surface-fg",
                    )}
                  >
                    <NavIcon name={c.icon} className="size-4" />
                    {c.title}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 hidden xl:block">
              <Button href={active.href} size="lg" arrow>
                {(
                  content.buttonLabel ?? "Explore the {catalogue} catalogue"
                ).replace("{catalogue}", active.title)}
              </Button>
            </div>
          </div>

          <div role="tabpanel" aria-label={`${active.title} catalogue preview`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={active.slug}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="columns-2 gap-3 md:columns-3 md:gap-4"
              >
                {tiles.map((tile, i) => (
                  <Link
                    key={tile.name}
                    href={`${active.href}?category=${encodeURIComponent(tile.name)}`}
                    data-cursor="View"
                    className={cn(
                      "group relative mb-3 block break-inside-avoid overflow-hidden rounded-[10px] md:mb-4",
                      TILE_RATIOS[i],
                    )}
                  >
                    <Image
                      src={tile.image}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 25vw, 50vw"
                      className="object-cover transition-transform duration-700 ease-(--ease-out-expo) group-hover:scale-105"
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-10 text-sm font-bold text-white">
                      {tile.name}
                    </span>
                  </Link>
                ))}
              </motion.div>
            </AnimatePresence>
            <div className="mt-6 xl:hidden">
              <Button href={active.href} size="lg" block="mobile" arrow>
                {(
                  content.buttonLabel ?? "Explore the {catalogue} catalogue"
                ).replace("{catalogue}", active.title)}
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
