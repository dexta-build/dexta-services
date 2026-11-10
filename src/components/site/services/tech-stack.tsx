import { AccentText } from "../accent-text";
import { Container } from "../container";
import { Eyebrow } from "../eyebrow";
import { Heading } from "../heading";
import { RevealGroup, RevealItem } from "../reveal";
import { Section } from "../section";

const CHIP_STYLES = [
  "bg-brand-cyan text-royal",
  "bg-ice text-royal",
  "bg-ocean-deep text-white",
  "bg-mint-soft text-mint-deep",
  "bg-lilac-soft text-lilac-deep",
];

/** Build pages: the technologies we work with, grouped as colourful chips. */
export function TechStack({
  eyebrow,
  title,
  body,
  groups,
}: {
  eyebrow: string;
  title: string;
  body: string;
  groups: { label: string; items: string[] }[];
}) {
  return (
    <Section surface="ice">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          <div className="flex flex-col gap-4">
            <Eyebrow rule>{eyebrow}</Eyebrow>
            <Heading size="h1">
              <AccentText text={title} />
            </Heading>
            <p className="text-surface-muted leading-relaxed">{body}</p>
          </div>
          <RevealGroup className="flex flex-col">
            {groups.map((group, g) => (
              <RevealItem
                key={group.label}
                className="border-surface-rule grid gap-3 border-b py-5 first:pt-0 md:grid-cols-[10rem_1fr] md:items-center"
              >
                <p className="text-eyebrow text-surface-muted">{group.label}</p>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span
                      key={item}
                      className={`rounded-full px-3.5 py-1.5 text-sm font-bold ${CHIP_STYLES[g % CHIP_STYLES.length]}`}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </Container>
    </Section>
  );
}
