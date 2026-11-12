import { AccentText } from "../accent-text";
import { Container } from "../container";
import { DigitRoller } from "../digit-roller";
import { Eyebrow } from "../eyebrow";
import { Heading } from "../heading";
import { Section } from "../section";
import { HOME_STATS } from "@/lib/site/home-content";

/**
 * "Success in numbers". Mobile: number above its label. Tablet: 2×2 with
 * the number on top. Desktop: label on the left, big number on the right.
 */
export function StatsBand({
  content = HOME_STATS,
}: {
  content?: typeof HOME_STATS;
} = {}) {
  return (
    <Section surface="white">
      <Container>
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <Heading size="h1">
            <AccentText text={content.title} />
          </Heading>
        </div>
        <dl className="mt-10 grid md:mt-16 md:grid-cols-2 md:gap-x-10 xl:gap-x-12">
          {content.items.map((stat) => (
            <div
              key={stat.label}
              className="border-surface-rule flex flex-col-reverse gap-4 border-b py-8 md:py-10 xl:flex-row xl:items-center xl:justify-between xl:gap-8"
            >
              <dt className="text-surface-muted max-w-sm text-[0.9375rem] leading-relaxed xl:text-lg">
                {stat.label}
              </dt>
              <dd className="text-[4rem] tracking-[-0.02em] font-[family-name:var(--font-accent)] md:text-[4.75rem] xl:text-[6rem]">
                <DigitRoller value={stat.value} suffix={stat.suffix} />
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </Section>
  );
}
