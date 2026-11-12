import { AccentText } from "../accent-text";
import { Container } from "../container";
import { Heading } from "../heading";
import { Reveal } from "../reveal";
import { Section } from "../section";

/** The admin's manifesto line as a large centred statement. */
export function ManifestoStatement({ text }: { text: string }) {
  if (!text) return null;
  return (
    // No bottom padding: the "Who we are" section below supplies the gap.
    <Section spacing="md" className="pb-0 md:pb-0 xl:pb-0">
      <Container size="narrow">
        <Reveal>
          <Heading size="h1" as="p" className="text-center">
            <AccentText text={text} />
          </Heading>
        </Reveal>
      </Container>
    </Section>
  );
}
