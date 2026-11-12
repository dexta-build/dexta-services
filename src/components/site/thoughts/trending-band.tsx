import Link from "next/link";
import { AccentText } from "../accent-text";
import { Container } from "../container";
import { Eyebrow } from "../eyebrow";
import { MediaAsset } from "../media-asset";
import { Section } from "../section";
import { PostAuthor, PostMeta } from "./post-card";
import type { ThoughtCategory, ThoughtSummary } from "@/lib/site/thoughts-data";

/**
 * Superside's dark "Trending" band: one category, a large lead story with
 * its image beside the text, and two smaller stories down the side.
 */
export function TrendingBand({
  category,
  posts,
  label = "Trending",
  readLabel,
}: {
  category: ThoughtCategory;
  posts: ThoughtSummary[];
  label?: string;
  readLabel?: string;
}) {
  const [lead, ...rest] = posts;
  if (!lead) return null;
  const side = rest.slice(0, 2);

  return (
    <Section surface="royal">
      <Container>
        <div className="mb-10 flex flex-col items-center gap-3 text-center md:mb-14">
          {label && <Eyebrow>{label}</Eyebrow>}
          <Link
            href={`/thoughts/category/${category.slug}`}
            className="text-h1 dx-heading hover:text-brand-cyan transition-colors"
          >
            {category.name}
          </Link>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.9fr_1fr] lg:gap-8">
          <Link
            href={`/thoughts/${lead.slug}`}
            data-cursor="Read"
            className="group flex flex-col gap-6"
          >
            <span className="relative block aspect-[16/10] overflow-hidden rounded-[10px]">
              <span className="absolute inset-0 transition-transform duration-700 ease-(--ease-out-expo) group-hover:scale-105">
                <MediaAsset
                  media={{ kind: "image", src: lead.cover, alt: "" }}
                  sizes="(min-width: 1024px) 60vw, 100vw"
                />
              </span>
            </span>
            <span className="flex flex-col gap-3">
              <PostMeta post={lead} readLabel={readLabel} />
              <span className="dx-heading text-h2 group-hover:text-brand-cyan transition-colors">
                <AccentText text={lead.title} />
              </span>
              <span className="text-surface-muted line-clamp-3 max-w-3xl leading-relaxed">
                {lead.excerpt}
              </span>
              <span className="mt-2">
                <PostAuthor author={lead.author} />
              </span>
            </span>
          </Link>

          {side.length > 0 && (
            <div className="border-surface-rule flex flex-col gap-8 lg:border-l lg:pl-8">
              {side.map((p) => (
                <Link
                  key={p.id}
                  href={`/thoughts/${p.slug}`}
                  data-cursor="Read"
                  className="group flex flex-col gap-4"
                >
                  <span className="relative block aspect-[16/10] overflow-hidden rounded-[10px]">
                    <span className="absolute inset-0 transition-transform duration-700 ease-(--ease-out-expo) group-hover:scale-105">
                      <MediaAsset
                        media={{ kind: "image", src: p.cover, alt: "" }}
                        sizes="(min-width: 1024px) 28vw, 100vw"
                      />
                    </span>
                  </span>
                  <span className="dx-heading group-hover:text-brand-cyan text-lg leading-snug font-bold transition-colors">
                    <AccentText text={p.title} />
                  </span>
                  <span className="text-surface-muted line-clamp-2 text-sm leading-relaxed">
                    {p.excerpt}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}
