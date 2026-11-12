import { Accordion } from "../accordion";
import { AccentText } from "../accent-text";
import { Container } from "../container";
import { Eyebrow } from "../eyebrow";
import { Heading } from "../heading";
import { Section } from "../section";

/** Questions and answers: heading on the left, accordion on the right. */
export function FaqSection({
  title,
  faqs,
}: {
  title: string;
  faqs: { q: string; a: string }[];
}) {
  if (faqs.length === 0) return null;
  return (
    <Section>
      <Container className="grid gap-8 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <div className="flex flex-col gap-4">
          <Eyebrow>FAQs</Eyebrow>
          <Heading size="h1">
            <AccentText text={title} />
          </Heading>
        </div>
        <Accordion
          items={faqs.map((f, i) => ({
            id: String(i),
            question: f.q,
            answer: f.a,
          }))}
        />
      </Container>
    </Section>
  );
}
