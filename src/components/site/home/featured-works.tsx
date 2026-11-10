import Link from "next/link";
import { cn } from "@/lib/utils";
import { AccentText } from "../accent-text";
import { Button } from "../button";
import { Container } from "../container";
import { Eyebrow } from "../eyebrow";
import { Heading } from "../heading";
import { MediaAsset } from "../media-asset";
import { RevealGroup, RevealItem } from "../reveal";
import { Section } from "../section";
import type { HomeWork } from "@/lib/site/home-data";
import { HOME_WORKS } from "@/lib/site/home-content";

/**
 * Desktop rhythm from Superside: a wide card then two narrow ones, then the
 * reverse. Tablet: first card full width, then pairs. Mobile: one column.
 */
const DESKTOP_SPANS = ["xl:col-span-2", "", "", "", "", "xl:col-span-2"];

export function FeaturedWorks({ works }: { works: HomeWork[] }) {
  if (works.length === 0) return null;

  return (
    <Section>
      <Container>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex max-w-2xl flex-col gap-4">
            <Eyebrow>{HOME_WORKS.eyebrow}</Eyebrow>
            <Heading size="h1">
              <AccentText text={HOME_WORKS.title} />
            </Heading>
          </div>
          <Button
            href={HOME_WORKS.cta.href}
            variant="outline"
            size="lg"
            block="mobile"
            arrow
          >
            {HOME_WORKS.cta.label}
          </Button>
        </div>

        <RevealGroup className="mt-10 grid gap-x-4 gap-y-8 md:mt-14 md:grid-cols-2 xl:grid-cols-4">
          {works.map((work, i) => (
            <RevealItem
              key={work.id}
              className={cn(
                i === 0 && "md:col-span-2",
                DESKTOP_SPANS[i],
                i === 0 && "xl:col-span-2",
              )}
            >
              <Link
                href={work.href ?? "/works"}
                data-cursor="View"
                className="group flex flex-col gap-4"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-[10px] md:aspect-auto md:h-[320px] xl:h-[360px]">
                  <div className="absolute inset-0 transition-transform duration-700 ease-(--ease-out-expo) group-hover:scale-105">
                    <MediaAsset
                      media={work.media}
                      sizes="(min-width: 1280px) 50vw, (min-width: 768px) 50vw, 100vw"
                    />
                  </div>
                </div>
                <div>
                  <p className="font-[family-name:var(--font-accent)] text-2xl leading-tight capitalize italic">
                    {work.title}
                  </p>
                  <p className="text-surface-muted mt-1 text-sm">
                    {[work.serviceLabel, ...work.tags].join(", ")}
                  </p>
                </div>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </Section>
  );
}
