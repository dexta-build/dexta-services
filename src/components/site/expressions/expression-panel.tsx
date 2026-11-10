import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccentText } from "../accent-text";
import { Button } from "../button";
import { Container } from "../container";
import { Reveal } from "../reveal";
import { BrowserFrame, PhoneFrame } from "./device-frames";
import type { Expression } from "@/lib/site/expressions-data";

/**
 * One product, full width in its own colour: what it is and its key
 * features beside a browser screenshot (with the phone view tucked in).
 * Panels alternate sides down the page.
 */
export function ExpressionPanel({
  expression: e,
  index,
}: {
  expression: Expression;
  index: number;
}) {
  const flip = index % 2 === 1;
  return (
    <section
      id={e.slug}
      data-surface={e.surface}
      aria-labelledby={`${e.slug}-title`}
      className="bg-surface text-surface-fg scroll-mt-20 overflow-hidden py-16 md:py-24 xl:scroll-mt-24"
    >
      <Container className="grid items-center gap-12 lg:grid-cols-[1fr_1.25fr] lg:gap-16">
        <div className={cn("flex flex-col gap-5", flip && "lg:order-2")}>
          <p className="text-eyebrow text-surface-muted">
            {String(index + 1).padStart(2, "0")} · {e.category}
          </p>
          <h2 id={`${e.slug}-title`} className="text-h1">
            {e.name}
          </h2>
          <p className="dx-heading text-h3 leading-snug">
            <AccentText text={e.tagline} />
          </p>
          <p className="text-surface-fg/90 max-w-xl leading-relaxed">
            {e.description}
          </p>
          {e.features.length > 0 && (
            <ul className="border-surface-rule mt-2 grid gap-x-8 border-t sm:grid-cols-2">
              {e.features.map((f) => (
                <li
                  key={f}
                  className="border-surface-rule flex items-start gap-3 border-b py-3 text-sm"
                >
                  <Check aria-hidden className="mt-0.5 size-4 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <Button href={e.websiteUrl} external arrow block="mobile">
              Visit {e.host}
            </Button>
            <Button
              href={`/expressions/${e.slug}`}
              variant="outline"
              block="mobile"
            >
              Read the story
            </Button>
          </div>
        </div>

        <Reveal className={cn("relative", flip && "lg:order-1")}>
          <BrowserFrame
            src={e.cover}
            host={e.host}
            alt={`${e.name} website`}
            priority={index === 0}
          />
          {e.mobile && (
            <PhoneFrame
              src={e.mobile}
              alt={`${e.name} on a phone`}
              className={cn(
                "absolute -bottom-8 w-[26%] max-w-[180px] md:-bottom-10",
                flip ? "-left-2 md:-left-6" : "-right-2 md:-right-6",
              )}
            />
          )}
        </Reveal>
      </Container>
    </section>
  );
}
