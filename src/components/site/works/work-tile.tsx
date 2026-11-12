"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";
import { ArrowUpRight, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaAsset } from "../media-asset";
import type { WorkProject } from "@/lib/site/works-data";

const CYCLE_MS = 3200;

type WorkTileProps = {
  work: WorkProject;
  expanded: boolean;
  onToggle: () => void;
  className?: string;
  /** Larger type for the featured row. */
  large?: boolean;
  sizes?: string;
  /** Text of the link on the tile. */
  viewLabel?: string;
};

/**
 * Superside's "Our work" tile: a full-bleed cover that cycles through the
 * project's images, with a serif title + "+" and tags. When the parent
 * expands it in place:
 * - 1280px+: a 2×2 gallery with the title, tags and description below.
 * - 768–1279px: title, tags and description on top, then the images
 *   stacked and scrollable inside the tile.
 * Clicking anywhere on the expanded tile closes it again.
 */
export function WorkTile({
  work,
  expanded,
  onToggle,
  className,
  large = false,
  sizes = "(min-width: 768px) 50vw, 100vw",
  viewLabel = "View project",
}: WorkTileProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const images = work.media.filter((m) => m.kind !== "video");
  const cycling = inView && !expanded && !reduce && images.length > 1;

  useEffect(() => {
    if (!cycling) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % images.length),
      CYCLE_MS,
    );
    return () => clearInterval(id);
  }, [cycling, images.length]);

  const cover = images.length ? images[index % images.length] : work.media[0];
  const gallery = work.media.slice(0, 4);
  const meta = [work.category, ...work.tags].join(", ");

  const projectLink = (
    <Link
      href={`/works/${work.slug}`}
      data-cursor="View"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1.5 self-start text-sm font-bold"
    >
      <span className="dx-link">{viewLabel}</span>
      <ArrowUpRight aria-hidden className="size-4" />
    </Link>
  );

  return (
    <div
      ref={ref}
      data-cursor={expanded ? "Close" : "View +"}
      className={cn(
        "group bg-royal relative overflow-hidden text-white",
        className,
      )}
    >
      {!expanded && (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={false}
          aria-label={`Open ${work.title}`}
          className="focus-visible:outline-brand-cyan absolute inset-0 z-10 focus-visible:outline-2 focus-visible:-outline-offset-4"
        />
      )}

      <AnimatePresence initial={false} mode="wait">
        {!expanded ? (
          <motion.div
            key="cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <AnimatePresence initial={false}>
              {cover && (
                <motion.div
                  key={cover.src}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.03]"
                >
                  <MediaAsset media={cover} sizes={sizes} />
                </motion.div>
              )}
            </AnimatePresence>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent px-5 pt-24 pb-5 md:px-6 md:pb-6">
              {work.featured && (
                <span className="bg-brand-cyan text-royal mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold">
                  Featured
                </span>
              )}
              <p
                className={cn(
                  "flex items-baseline gap-2 font-[family-name:var(--font-accent)] leading-tight",
                  large ? "text-4xl md:text-5xl" : "text-3xl md:text-4xl",
                )}
              >
                {work.title}
                <Plus aria-hidden className="size-5 shrink-0 opacity-80" />
              </p>
              <p className="mt-1.5 text-sm text-white/80">{meta}</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            onClick={onToggle}
            className="absolute inset-0 z-20"
          >
            {/* Keyboard users close with this (or Escape) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              aria-expanded
              aria-label={`Close ${work.title}`}
              autoFocus
              className="bg-royal/80 absolute top-3 right-3 z-30 inline-flex size-10 items-center justify-center rounded-full opacity-0 focus-visible:opacity-100"
            >
              <X className="size-4" />
            </button>

            {/* 1280px+: 2×2 gallery with details below */}
            <div className="hidden h-full flex-col xl:flex">
              <div
                className={cn(
                  "grid min-h-0 flex-1 gap-2 p-2",
                  gallery.length > 1
                    ? "grid-cols-2 grid-rows-2"
                    : "grid-cols-1",
                )}
              >
                {gallery.map((m, i) => (
                  <motion.div
                    key={m.src}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.07 }}
                    className={cn(
                      "relative overflow-hidden rounded-[8px]",
                      gallery.length === 3 && i === 0 && "row-span-2",
                    )}
                  >
                    <MediaAsset media={m} sizes="25vw" />
                  </motion.div>
                ))}
              </div>
              <div className="grid grid-cols-[1fr_1.2fr] gap-6 px-5 pt-3 pb-4">
                <div>
                  <p className="font-[family-name:var(--font-accent)] text-3xl leading-tight">
                    {work.title}
                  </p>
                  <p className="mt-1 text-sm text-white/75">{meta}</p>
                </div>
                <div className="flex flex-col gap-3">
                  <p className="line-clamp-3 text-sm leading-relaxed text-white/85">
                    {work.description}
                  </p>
                  {projectLink}
                </div>
              </div>
            </div>

            {/* 768–1279px: details on top, images stacked and scrollable */}
            <div className="dx-no-scrollbar flex h-full flex-col gap-3 overflow-y-auto p-4 xl:hidden">
              <p className="font-[family-name:var(--font-accent)] text-3xl leading-tight">
                {work.title}
              </p>
              <p className="text-sm text-white/75">{meta}</p>
              <p className="text-sm leading-relaxed text-white/85">
                {work.description}
              </p>
              {projectLink}
              {gallery.map((m) => (
                <div
                  key={`s-${m.src}`}
                  className="relative aspect-[4/3] shrink-0 overflow-hidden rounded-[8px]"
                >
                  <MediaAsset media={m} sizes="50vw" />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
