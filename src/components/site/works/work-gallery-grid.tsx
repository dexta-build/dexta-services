"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaAsset } from "../media-asset";
import { MediaViewer, type ViewerItem } from "../media-viewer";
import type { MediaItem } from "../media-asset";

const RATIOS = [
  "aspect-[4/5]",
  "aspect-square",
  "aspect-[4/3]",
  "aspect-[3/4]",
  "aspect-square",
];

/**
 * A project's media as a masonry grid. Any item opens the swipeable viewer
 * (arrows, keyboard, touch), starting at that item.
 */
export function WorkGalleryGrid({
  media,
  title,
}: {
  media: MediaItem[];
  title: string;
}) {
  const [index, setIndex] = useState<number | null>(null);
  const items: ViewerItem[] = media.map((m, i) => ({
    ...m,
    id: `${i}-${m.src}`,
    title,
    subtitle: `${i + 1} of ${media.length}`,
  }));

  return (
    <>
      <div className="columns-1 gap-3 sm:columns-2 md:gap-4 lg:columns-3">
        {media.map((m, i) => (
          <button
            key={`${m.src}-${i}`}
            type="button"
            onClick={() => setIndex(i)}
            data-cursor="View"
            aria-label={`View image ${i + 1} of ${media.length}`}
            className={cn(
              "group bg-royal relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-[10px] md:mb-4",
              RATIOS[i % RATIOS.length],
            )}
          >
            <span className="absolute inset-0 transition-transform duration-700 ease-(--ease-out-expo) group-hover:scale-105">
              <MediaAsset
                media={m}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              />
            </span>
            {m.kind === "video" && (
              <span className="bg-royal/70 text-ice absolute top-3 right-3 inline-flex size-10 items-center justify-center rounded-full">
                <Play className="size-4 fill-current" />
              </span>
            )}
          </button>
        ))}
      </div>
      <MediaViewer
        items={items}
        index={index}
        onIndexChange={setIndex}
        label={title}
      />
    </>
  );
}
