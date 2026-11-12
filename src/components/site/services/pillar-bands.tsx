import { AccentText } from "../accent-text";
import { Button } from "../button";
import { Container } from "../container";
import { Heading } from "../heading";
import { BentoGrid } from "./offerings-bento";
import { SERVICES_HUB, type Offering } from "@/lib/site/services-content";

/**
 * The services overview's main band (Superside's /design-services): one
 * dark section with a centred serif heading and a bento of service cards
 * per pillar.
 */
export type PillarBand = {
  key: "design" | "build" | "print";
  title: string;
  items: Offering[];
};

export function PillarBands({
  groups = SERVICES_HUB.groups,
  pillars,
}: {
  groups?: typeof SERVICES_HUB.groups;
  /** Visible groups with their visible services, in order. */
  pillars: PillarBand[];
}) {
  return (
    <section
      data-surface="royal"
      className="bg-surface text-surface-fg py-16 md:py-24 xl:py-32"
    >
      <Container className="flex flex-col gap-20 md:gap-28">
        {pillars.map((pillar) => {
          const key = pillar.key;
          const group = groups[key];
          return (
            <div key={key} id={key} className="scroll-mt-28">
              <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
                <Heading size="h1">
                  <AccentText text={group.title} />
                </Heading>
                {group.subtitle && (
                  <p className="dx-accent -mt-2 text-2xl md:text-3xl">
                    {group.subtitle}
                  </p>
                )}
                <p className="text-surface-muted leading-relaxed">
                  {group.body}
                </p>
              </div>
              <BentoGrid items={pillar.items} className="mt-10 md:mt-12" />
              <div className="mt-8 flex justify-center">
                <Button
                  href={`/services/${key}`}
                  variant="outline"
                  size="lg"
                  block="mobile"
                  arrow
                >
                  Explore all {pillar.title.toLowerCase()} services
                </Button>
              </div>
            </div>
          );
        })}
      </Container>
    </section>
  );
}
