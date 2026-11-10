"use client";

import Image from "next/image";
import { useState } from "react";
import { Play } from "lucide-react";
import { Button, MediaViewer, type ViewerItem } from "@/components/site";

const items: ViewerItem[] = [
  {
    id: "1",
    kind: "image",
    src: "/images/school1.jpg",
    alt: "Sample work 1",
    title: (
      <>
        Royal <em>wedding</em> invitation suite
      </>
    ),
    subtitle: "Wedding",
    tags: ["Invitation cards", "Foil print"],
    badge: "Wedding",
  },
  {
    id: "2",
    kind: "image",
    src: "/images/school2.jpg",
    alt: "Sample work 2",
    title: (
      <>
        Programme <em>booklet</em>
      </>
    ),
    subtitle: "Wedding",
    tags: ["Brochures"],
    badge: "Wedding",
  },
  {
    id: "3",
    kind: "video",
    src: "/videos/video1.mp4",
    alt: "Sample video",
    title: (
      <>
        Event <em>motion</em> teaser
      </>
    ),
    subtitle: "Events",
    tags: ["Video"],
    badge: "Events",
  },
  {
    id: "4",
    kind: "image",
    src: "/images/school3.jpg",
    alt: "Sample work 4",
    title: (
      <>
        Souvenir <em>tote</em> bags
      </>
    ),
    subtitle: "Events",
    tags: ["Merch"],
    badge: "Events",
  },
  {
    id: "5",
    kind: "image",
    src: "/images/school4.jpg",
    alt: "Sample work 5",
    title: (
      <>
        Memorial <em>brochure</em>
      </>
    ),
    subtitle: "Burial",
    tags: ["Brochures"],
    badge: "Burial",
  },
  {
    id: "6",
    kind: "image",
    src: "/images/school5.jpg",
    alt: "Sample work 6",
    title: (
      <>
        Landing <em>page</em> concept
      </>
    ),
    subtitle: "Apps & websites",
    tags: ["Web design"],
    badge: "Apps & websites",
  },
];

/** Demo grid + viewer, with a mock price/MOQ panel like catalogue items. */
export function ViewerDemo() {
  const [index, setIndex] = useState<number | null>(null);

  return (
    <>
      <div className="columns-2 gap-3 md:columns-3 md:gap-4">
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setIndex(i)}
            data-cursor="View"
            className="group relative mb-3 block w-full overflow-hidden rounded-[10px] break-inside-avoid md:mb-4"
            style={{
              aspectRatio:
                i % 3 === 0 ? "3 / 4" : i % 3 === 1 ? "1 / 1" : "4 / 5",
            }}
          >
            {item.kind === "video" ? (
              <span className="bg-royal text-ice absolute inset-0 flex items-center justify-center">
                <Play className="size-8" />
              </span>
            ) : (
              <Image
                src={item.src}
                alt={item.alt ?? ""}
                fill
                sizes="(min-width: 768px) 33vw, 50vw"
                className="object-cover transition-transform duration-700 ease-(--ease-out-expo) group-hover:scale-105"
              />
            )}
          </button>
        ))}
      </div>

      <MediaViewer
        items={items}
        index={index}
        onIndexChange={setIndex}
        label="Catalogue preview"
        renderDetails={(item) => (
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-eyebrow text-surface-muted">{item.subtitle}</p>
              <p className="mt-2 text-2xl font-bold">₦45,000</p>
              <p className="text-surface-muted text-sm">
                ≈ $29 · €27 · £23 per pack (mock prices)
              </p>
            </div>
            <dl className="border-surface-rule grid grid-cols-2 gap-3 border-t pt-4 text-sm">
              <dt className="text-surface-muted">MOQ</dt>
              <dd className="text-right font-bold">50 pieces</dd>
              <dt className="text-surface-muted">Lead time</dt>
              <dd className="text-right font-bold">5–7 days</dd>
            </dl>
            <Button block arrow>
              Order on WhatsApp
            </Button>
          </div>
        )}
      />
    </>
  );
}
