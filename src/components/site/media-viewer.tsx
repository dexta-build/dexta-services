"use client";

import { useCallback, useEffect, useState } from "react";
import { Dialog } from "radix-ui";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type PanInfo,
} from "motion/react";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { MediaAsset, type MediaItem } from "./media-asset";

export type ViewerItem = MediaItem & {
  id: string;
  /** Title under the media. Wrap accent words in <em> for the serif italic. */
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  tags?: string[];
  /** Small pill shown at the right of the caption (e.g. a category). */
  badge?: string;
};

type MediaViewerProps = {
  items: ViewerItem[];
  /** Index of the open item, or null when closed. */
  index: number | null;
  onIndexChange: (index: number | null) => void;
  /**
   * Optional side panel (desktop) / bottom panel (mobile) for extra detail,
   * e.g. price, MOQ and the order button on catalogue items.
   */
  renderDetails?: (item: ViewerItem) => React.ReactNode;
  /** Accessible name for the dialog. */
  label?: string;
  /** Show the thumbnail strip on phones and tablets too (default: lg+). */
  thumbnailsOnMobile?: boolean;
};

const SWIPE_DISTANCE = 80;
const SWIPE_VELOCITY = 400;

/**
 * Full-screen media viewer patterned on Superside's preview modal: dark
 * backdrop, large rounded media, round close button, serif caption.
 * Adds arrows, keyboard, touch swipe, a counter and thumbnails.
 */
export function MediaViewer({
  items,
  index,
  onIndexChange,
  renderDetails,
  label = "Media viewer",
  thumbnailsOnMobile = false,
}: MediaViewerProps) {
  const open = index !== null && items.length > 0;
  const current = open ? items[index] : null;
  const reduce = useReducedMotion();
  const [direction, setDirection] = useState(0);
  const count = items.length;

  const go = useCallback(
    (step: number) => {
      if (index === null || count < 2) return;
      setDirection(step);
      onIndexChange((index + step + count) % count);
    },
    [index, count, onIndexChange],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go]);

  // Warm the cache for the neighbouring images so swiping feels instant.
  useEffect(() => {
    if (index === null || count < 2) return;
    [items[(index + 1) % count], items[(index - 1 + count) % count]].forEach(
      (item) => {
        if (item && item.kind !== "video") {
          const img = new window.Image();
          img.src = item.src;
        }
      },
    );
  }, [index, items, count]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) {
      go(1);
    } else if (
      info.offset.x > SWIPE_DISTANCE ||
      info.velocity.x > SWIPE_VELOCITY
    ) {
      go(-1);
    }
  };

  const slide = reduce
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: (d: number) => ({ x: d >= 0 ? 80 : -80, opacity: 0 }),
        animate: { x: 0, opacity: 1 },
        exit: (d: number) => ({ x: d >= 0 ? -80 : 80, opacity: 0 }),
      };

  const details = current && renderDetails ? renderDetails(current) : null;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => !next && onIndexChange(null)}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 fixed inset-0 z-[100] bg-[#00042f]/92 backdrop-blur-md" />
        <Dialog.Content
          data-surface="royal"
          aria-describedby={undefined}
          className="text-surface-fg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98] fixed inset-0 z-[101] flex flex-col font-[family-name:var(--font-mont)] outline-none"
        >
          <Dialog.Title className="sr-only">{label}</Dialog.Title>

          {/* Top bar */}
          <div className="flex items-center justify-between px-4 pt-4 md:px-8 md:pt-6">
            <span className="text-surface-muted text-sm tabular-nums">
              {count > 1 && index !== null ? `${index + 1} / ${count}` : " "}
            </span>
            <Dialog.Close
              aria-label="Close"
              className="border-surface-fg/40 hover:bg-surface-fg hover:text-surface inline-flex size-12 items-center justify-center rounded-full border transition-colors"
            >
              <X className="size-5" />
            </Dialog.Close>
          </div>

          {/* Body */}
          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 pt-4 pb-6 md:px-8 lg:overflow-hidden",
              details && "lg:flex-row lg:gap-10",
            )}
          >
            {/* On mobile the body scrolls, so this column must not shrink;
                on desktop it fills the space beside the details panel. */}
            <div className="flex min-w-0 shrink-0 flex-col gap-5 lg:min-h-0 lg:flex-1 lg:shrink">
              <div className="relative h-[52vh] w-full shrink-0 md:h-[60vh] lg:h-auto lg:min-h-0 lg:flex-1">
                <AnimatePresence
                  initial={false}
                  custom={direction}
                  mode="popLayout"
                >
                  {current && (
                    <motion.div
                      key={current.id}
                      custom={direction}
                      variants={slide}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      drag={count > 1 && current.kind !== "video" ? "x" : false}
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.4}
                      onDragEnd={onDragEnd}
                      className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"
                    >
                      <div className="relative h-full w-full overflow-hidden rounded-[10px]">
                        <MediaAsset
                          media={current}
                          objectFit="contain"
                          sizes="(min-width: 1024px) 70vw, 100vw"
                          controls={current.kind === "video"}
                          priority
                          className="pointer-events-none select-none"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {count > 1 && (
                  <>
                    <ArrowButton
                      side="left"
                      onClick={() => go(-1)}
                      label="Previous"
                    />
                    <ArrowButton
                      side="right"
                      onClick={() => go(1)}
                      label="Next"
                    />
                  </>
                )}
              </div>

              {current && (
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-8">
                  <div className="flex flex-col gap-2">
                    {current.title && (
                      <p className="dx-heading text-h3 md:text-h2 max-w-3xl font-[family-name:var(--font-accent)] leading-tight">
                        {current.title}
                      </p>
                    )}
                    {(current.subtitle || current.tags?.length) && (
                      <p className="text-surface-muted text-sm">
                        {current.subtitle}
                        {current.subtitle && current.tags?.length ? " · " : ""}
                        {current.tags?.join(", ")}
                      </p>
                    )}
                  </div>
                  {current.badge && (
                    <span className="border-surface-fg/60 self-start rounded-full border px-3 py-1 text-xs whitespace-nowrap md:self-auto">
                      {current.badge}
                    </span>
                  )}
                </div>
              )}

              {count > 1 && (
                <Thumbnails
                  items={items}
                  onMobile={thumbnailsOnMobile}
                  active={index ?? 0}
                  onSelect={(i) => {
                    setDirection(i > (index ?? 0) ? 1 : -1);
                    onIndexChange(i);
                  }}
                />
              )}
            </div>

            {details && (
              <aside className="bg-surface-card shrink-0 rounded-[10px] p-5 md:p-6 lg:w-[22rem] lg:overflow-y-auto xl:w-[24rem]">
                {details}
              </aside>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ArrowButton({
  side,
  onClick,
  label,
}: {
  side: "left" | "right";
  onClick: () => void;
  label: string;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "bg-canvas text-royal absolute top-1/2 z-10 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 md:inline-flex",
        side === "left" ? "left-3" : "right-3",
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}

function Thumbnails({
  items,
  active,
  onSelect,
  onMobile,
}: {
  items: ViewerItem[];
  onMobile: boolean;
  active: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div
      className={cn(
        "dx-no-scrollbar shrink-0 gap-2 overflow-x-auto pb-1 lg:flex",
        onMobile ? "flex" : "hidden",
      )}
    >
      {items.map((item, i) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(i)}
          aria-label={`Show item ${i + 1}`}
          aria-current={i === active || undefined}
          className={cn(
            "relative size-14 shrink-0 overflow-hidden rounded-md opacity-50 ring-2 ring-transparent transition",
            i === active && "ring-brand-cyan opacity-100",
            i !== active && "hover:opacity-80",
          )}
        >
          {item.kind === "video" && !item.poster ? (
            <span className="bg-surface-card flex h-full w-full items-center justify-center">
              <Play className="size-4" />
            </span>
          ) : (
            <Image
              src={item.kind === "video" ? item.poster! : item.src}
              alt=""
              fill
              sizes="56px"
              unoptimized={item.kind === "gif"}
              className="object-cover"
            />
          )}
        </button>
      ))}
    </div>
  );
}
