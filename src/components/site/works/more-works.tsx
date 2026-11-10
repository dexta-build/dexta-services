import Link from "next/link";
import { Plus } from "lucide-react";
import { AccentText } from "../accent-text";
import { Container } from "../container";
import { Eyebrow } from "../eyebrow";
import { Heading } from "../heading";
import { MediaAsset } from "../media-asset";
import type { WorkProject } from "@/lib/site/works-data";

/** "More work": edge-to-edge tiles linking to other project pages. */
export function MoreWorks({ works }: { works: WorkProject[] }) {
  if (works.length === 0) return null;
  return (
    <section
      data-surface="canvas"
      className="bg-surface text-surface-fg pt-16 md:pt-24"
    >
      <Container className="flex flex-col gap-4 pb-8 md:pb-10">
        <Eyebrow>Keep exploring</Eyebrow>
        <Heading size="h1">
          <AccentText text="More *of our work*" />
        </Heading>
      </Container>
      <div className="grid md:grid-cols-2">
        {works.slice(0, 2).map((w) => (
          <Link
            key={w.id}
            href={`/works/${w.slug}`}
            data-cursor="View"
            className="group bg-royal relative block aspect-[4/5] overflow-hidden text-white md:aspect-[6/5]"
          >
            {w.media[0] && (
              <span className="absolute inset-0 transition-transform duration-700 ease-(--ease-out-expo) group-hover:scale-[1.03]">
                <MediaAsset
                  media={w.media[0]}
                  sizes="(min-width: 768px) 50vw, 100vw"
                />
              </span>
            )}
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent px-5 pt-24 pb-5 md:px-6 md:pb-6">
              <span className="flex items-baseline gap-2 font-[family-name:var(--font-accent)] text-3xl leading-tight md:text-4xl">
                {w.title}
                <Plus aria-hidden className="size-5 opacity-80" />
              </span>
              <span className="mt-1.5 block text-sm text-white/80">
                {[w.category, ...w.tags].join(", ")}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
