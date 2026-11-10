import Image from "next/image";
import { AccentText } from "../accent-text";
import { Container } from "../container";
import { Eyebrow } from "../eyebrow";
import { Heading } from "../heading";
import { Reveal } from "../reveal";
import { Section } from "../section";
import { stock } from "@/lib/site/stock-media";

/** "Focus on the big picture": copy on the left, photo on the right. */
export function ProblemSplit({
  eyebrow,
  title,
  lead,
  body,
  image,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  body: string;
  image: string;
}) {
  return (
    <Section>
      <Container className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16 xl:gap-24">
        <Reveal className="flex flex-col gap-6">
          <Eyebrow rule>{eyebrow}</Eyebrow>
          <Heading size="h1">
            <AccentText text={title} />
          </Heading>
          <p className="text-lead">{lead}</p>
          <p className="text-surface-muted leading-relaxed">{body}</p>
        </Reveal>
        <Reveal>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[10px] lg:aspect-[5/6]">
            <Image
              src={stock(image, 1200, 1400)}
              alt=""
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
