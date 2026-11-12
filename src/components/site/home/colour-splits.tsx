import Image from "next/image";
import { cn } from "@/lib/utils";
import { AccentText } from "../accent-text";
import { Button } from "../button";
import { Eyebrow } from "../eyebrow";
import { Heading } from "../heading";
import { Reveal } from "../reveal";
import type { Surface } from "../section";
import { HOME_SPLITS } from "@/lib/site/home-content";
import { stock } from "@/lib/site/stock-media";

/**
 * Superside's colour-blocked 2×2: a bold coloured text block beside a
 * full-bleed photo, then the reverse. Stacks on mobile with the text first
 * for the first row and the photo first for the second, like Superside.
 */
export function ColourSplits({
  items = HOME_SPLITS,
}: {
  items?: typeof HOME_SPLITS;
} = {}) {
  return (
    <section>
      {items.map((split, i) => {
        const reverse = i % 2 === 1;
        return (
          <div key={split.eyebrow} className="grid lg:grid-cols-2">
            <div
              data-surface={split.surface as Surface}
              className={cn(
                "bg-surface text-surface-fg flex items-center px-4 py-16 md:px-8 md:py-20 xl:px-[max(3rem,calc((100vw-82rem)/2+3rem))] xl:py-28",
                reverse ? "order-2 xl:pl-20" : "xl:pr-20",
              )}
            >
              <Reveal className="flex max-w-xl flex-col gap-6">
                <Eyebrow rule className="text-surface-accent">
                  {split.eyebrow}
                </Eyebrow>
                <Heading size="h1" className="[&_em]:text-surface-accent">
                  <AccentText text={split.title} />
                </Heading>
                <p className="text-lead">{split.lead}</p>
                <p className="text-surface-muted leading-relaxed">
                  {split.body}
                </p>
                <div>
                  <Button href={split.cta.href} size="lg" block="mobile" arrow>
                    {split.cta.label}
                  </Button>
                </div>
              </Reveal>
            </div>
            <div
              className={cn(
                "relative min-h-[22rem] md:min-h-[30rem]",
                reverse && "order-1",
              )}
            >
              <Image
                src={stock(split.image, 1400, 1200)}
                alt=""
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        );
      })}
    </section>
  );
}
