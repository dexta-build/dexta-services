import { AccentText } from "../accent-text";
import { Container } from "../container";
import { DigitRoller } from "../digit-roller";
import { Eyebrow } from "../eyebrow";
import { Heading } from "../heading";
import { Section } from "../section";

/** Centred trust statement with two big rolling numbers underneath. */
export function TrustStats({
  eyebrow,
  title,
  body,
  stats,
}: {
  eyebrow: string;
  title: string;
  body: string;
  stats: { value: number; suffix?: string; label: string }[];
}) {
  return (
    <Section surface="white" spacing="md">
      <Container
        size="narrow"
        className="flex flex-col items-center text-center"
      >
        <Eyebrow>{eyebrow}</Eyebrow>
        <Heading size="h1" className="mt-4">
          <AccentText text={title} />
        </Heading>
        <p className="text-surface-muted mt-5 max-w-xl leading-relaxed">
          {body}
        </p>
      </Container>
      <Container>
        <dl className="mx-auto mt-12 grid max-w-4xl gap-x-12 md:grid-cols-2">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="border-surface-rule flex flex-col gap-3 border-b py-6 md:flex-row md:items-end md:justify-between"
            >
              <dd className="text-[3.75rem] leading-none tracking-[-0.02em] font-[family-name:var(--font-accent)] md:text-[4.5rem]">
                <DigitRoller value={stat.value} suffix={stat.suffix} />
              </dd>
              <dt className="text-surface-muted max-w-[14rem] text-sm md:text-right">
                {stat.label}
              </dt>
            </div>
          ))}
        </dl>
      </Container>
    </Section>
  );
}
