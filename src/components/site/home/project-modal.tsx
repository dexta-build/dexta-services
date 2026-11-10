"use client";

import { useEffect, useRef } from "react";
import { Dialog } from "radix-ui";
import Link from "next/link";
import { ArrowUpRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaAsset } from "../media-asset";
import type { HeroProject } from "@/lib/site/home-data";

type ProjectModalProps = {
  project: HeroProject | null;
  onClose: () => void;
  /** Optional link to the project's own page (shown under the description). */
  href?: string;
};

/** Every 5th item is a large tile; the rest fill a two-row grid between them. */
const isLarge = (i: number) => i % 5 === 0;

/**
 * Full-screen project gallery opened from a hero tile, patterned on
 * Superside's:
 * - Desktop (1280+): a sideways gallery (one large tile, then a two-row
 *   grid of smaller ones, repeating). The mouse wheel scrolls it sideways;
 *   arrow keys work too. Project details sit in a bar along the bottom.
 * - Phones, tablets and small laptops: details at the top, then the media stacked vertically,
 *   with a round close button floating at the bottom.
 */
export function ProjectModal({ project, onClose, href }: ProjectModalProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const open = project !== null;

  // Vertical wheel scrolls the desktop gallery sideways.
  useEffect(() => {
    if (!open) return;
    let el: HTMLDivElement | null = null;
    const onWheel = (e: WheelEvent) => {
      if (!el || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    const onKey = (e: KeyboardEvent) => {
      if (!el) return;
      if (e.key === "ArrowRight")
        el.scrollBy({ left: 420, behavior: "smooth" });
      if (e.key === "ArrowLeft")
        el.scrollBy({ left: -420, behavior: "smooth" });
    };
    // The track mounts with the dialog; wait a frame for it.
    const id = requestAnimationFrame(() => {
      el = trackRef.current;
      el?.addEventListener("wheel", onWheel, { passive: false });
    });
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(id);
      el?.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 fixed inset-0 z-[100] bg-[#00042f]/95 backdrop-blur-md" />
        <Dialog.Content
          aria-describedby={undefined}
          data-surface="royal"
          className="text-surface-fg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.99] fixed inset-0 z-[101] font-[family-name:var(--font-mont)] outline-none"
        >
          {project && (
            <>
              <Dialog.Title className="sr-only">{project.title}</Dialog.Title>

              {/* ---------- Desktop: sideways gallery + bottom bar ---------- */}
              <div className="hidden h-full flex-col xl:flex">
                <div
                  ref={trackRef}
                  className="dx-no-scrollbar min-h-0 flex-1 overflow-x-auto overflow-y-hidden px-6 pt-6"
                >
                  <div className="grid h-full w-max grid-flow-col grid-rows-2 gap-4 pr-6">
                    {project.media.map((m, i) => (
                      <div
                        key={`${m.src}-${i}`}
                        className={cn(
                          "relative overflow-hidden rounded-[10px] bg-white/5",
                          isLarge(i)
                            ? "row-span-2 w-[min(58vw,56rem)]"
                            : "w-[19rem] xl:w-[21rem]",
                        )}
                      >
                        <MediaAsset
                          media={m}
                          sizes={isLarge(i) ? "58vw" : "340px"}
                          priority={i < 3}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-[1fr_1.4fr_auto] items-end gap-10 px-6 py-6">
                  <div>
                    <p className="font-[family-name:var(--font-accent)] text-3xl leading-tight">
                      {project.title}
                    </p>
                    <p className="text-surface-muted mt-1 text-sm">
                      {project.category}
                    </p>
                  </div>
                  <div className="max-w-xl">
                    <p className="text-surface-muted text-sm leading-relaxed">
                      {project.description}
                    </p>
                    {href && (
                      <Link
                        href={href}
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold"
                      >
                        <span className="dx-link">View full project</span>
                        <ArrowUpRight aria-hidden className="size-4" />
                      </Link>
                    )}
                  </div>
                  <div className="flex max-w-sm flex-wrap justify-end gap-2">
                    {project.tags.map((t) => (
                      <span
                        key={t}
                        className="border-surface-fg/50 rounded-full border px-3 py-1 text-xs whitespace-nowrap"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <Dialog.Close
                  aria-label="Close"
                  className="bg-royal/70 hover:bg-surface-fg hover:text-surface absolute top-4 right-4 inline-flex size-12 items-center justify-center rounded-full border border-white/30 backdrop-blur transition-colors"
                >
                  <X className="size-5" />
                </Dialog.Close>
              </div>

              {/* ---------- Phones/tablets: vertical scroll ---------- */}
              <div className="dx-no-scrollbar h-full overflow-y-auto px-4 pt-8 pb-28 md:px-8 xl:hidden">
                <p className="font-[family-name:var(--font-accent)] text-3xl leading-tight">
                  {project.title}
                </p>
                <p className="text-surface-muted mt-2 text-xs font-bold tracking-[0.14em] uppercase">
                  {project.category}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.tags.map((t) => (
                    <span
                      key={t}
                      className="border-surface-fg/50 rounded-full border px-3 py-1 text-xs"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <p className="text-surface-muted mt-4 text-sm leading-relaxed">
                  {project.description}
                </p>
                {href && (
                  <Link
                    href={href}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold"
                  >
                    <span className="dx-link">View full project</span>
                    <ArrowUpRight aria-hidden className="size-4" />
                  </Link>
                )}
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {project.media.map((m, i) => (
                    <div
                      key={`m-${m.src}-${i}`}
                      className="relative aspect-square overflow-hidden rounded-[10px] bg-white/5"
                    >
                      <MediaAsset
                        media={m}
                        sizes="(min-width: 768px) 50vw, 100vw"
                        priority={i < 2}
                      />
                    </div>
                  ))}
                </div>
                <Dialog.Close
                  aria-label="Close"
                  className="bg-brand-cyan text-royal fixed bottom-6 left-1/2 inline-flex size-12 -translate-x-1/2 items-center justify-center rounded-full shadow-lg"
                >
                  <X className="size-5" />
                </Dialog.Close>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
