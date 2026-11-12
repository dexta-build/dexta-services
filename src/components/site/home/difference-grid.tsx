import { Gem, Globe2, Layers, Zap } from "lucide-react";
import { AccentText } from "../accent-text";
import { Container } from "../container";
import { Eyebrow } from "../eyebrow";
import { Heading } from "../heading";
import { IconTile } from "../icon-tile";
import { RevealGroup, RevealItem } from "../reveal";
import { Section } from "../section";
import { HOME_DIFFERENCE } from "@/lib/site/home-content";

const ICONS = { gem: Gem, zap: Zap, layers: Layers, globe: Globe2 };

/** Superside's "built for brands that refuse to compromise": four icon benefits. */
export function DifferenceGrid({
  content = HOME_DIFFERENCE,
}: {
  content?: typeof HOME_DIFFERENCE;
} = {}) {
  return (
    <Section spacing="md" className="pt-0 md:pt-0 xl:pt-0">
      <Container>
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <Heading size="h1">
            <AccentText text={content.title} />
          </Heading>
        </div>
        <RevealGroup className="mt-12 grid gap-10 md:mt-16 md:grid-cols-2 md:gap-12 xl:grid-cols-4 xl:gap-10">
          {content.items.map((item) => {
            const Icon = ICONS[item.icon];
            return (
              <RevealItem key={item.title} className="flex flex-col gap-4">
                <IconTile>
                  <Icon />
                </IconTile>
                <p className="text-eyebrow text-surface-muted">{item.label}</p>
                <h3 className="text-h3">{item.title}</h3>
                <p className="text-surface-muted text-[0.9375rem] leading-relaxed">
                  {item.body}
                </p>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </Container>
    </Section>
  );
}
