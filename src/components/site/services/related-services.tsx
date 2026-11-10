import { AccentText } from "../accent-text";
import { Container } from "../container";
import { Eyebrow } from "../eyebrow";
import { Heading } from "../heading";
import { Section } from "../section";
import { BentoGrid } from "./offerings-bento";
import type { Offering } from "@/lib/site/services-content";

/** "Explore more services": sibling services as photo cards. */
export function RelatedServices({
  title,
  items,
}: {
  title: string;
  items: Offering[];
}) {
  if (items.length === 0) return null;
  return (
    <Section>
      <Container>
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <Eyebrow>Related services</Eyebrow>
          <Heading size="h1">
            <AccentText text={title} />
          </Heading>
        </div>
        <BentoGrid
          items={items.slice(0, 3)}
          columns={3}
          className="mt-10 md:mt-14"
        />
      </Container>
    </Section>
  );
}
