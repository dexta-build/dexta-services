import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { AccentText } from "../accent-text";
import { Button } from "../button";
import { Container } from "../container";
import { Eyebrow } from "../eyebrow";
import { Heading } from "../heading";
import { Reveal } from "../reveal";
import { Section } from "../section";
import { stock } from "@/lib/site/stock-media";

/**
 * Superside's "AI-enhanced workflows" card, retold as Dexta's quality
 * promise: a rounded card over a soft photo, copy on the left, three
 * check items on the right.
 */
export function QualityCard({
  eyebrow,
  title,
  body,
  image,
  items,
}: {
  eyebrow: string;
  title: string;
  body: string;
  image: string;
  items: { label: string; title: string }[];
}) {
  return (
    <Section surface="royal" spacing="sm">
      <Container>
        <Reveal>
          <div className="relative isolate overflow-hidden rounded-[10px] text-ice">
            <Image
              src={stock(image, 1800, 900)}
              alt=""
              fill
              sizes="100vw"
              className="-z-20 object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-gradient-to-r from-royal/95 via-royal/80 to-royal/50 backdrop-blur-[2px]"
            />
            <div className="grid gap-8 p-6 md:p-10 lg:grid-cols-2 lg:items-center lg:gap-12 lg:p-14">
              <div className="flex flex-col gap-5">
                <Eyebrow>{eyebrow}</Eyebrow>
                <Heading size="h1">
                  <AccentText text={title} />
                </Heading>
                <p className="text-surface-muted max-w-md leading-relaxed">
                  {body}
                </p>
                <div>
                  <Button href="/contact" block="mobile">
                    Start a project
                  </Button>
                </div>
              </div>
              <ul className="flex flex-col gap-3">
                {items.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-start gap-4 rounded-[10px] bg-white/10 p-4 backdrop-blur md:p-5"
                  >
                    <CheckCircle2
                      aria-hidden
                      className="text-brand-cyan mt-0.5 size-5 shrink-0"
                    />
                    <span className="flex flex-col gap-1">
                      <span className="text-eyebrow text-ice/70">
                        {item.label}
                      </span>
                      <span className="text-[1.0625rem] leading-snug">
                        {item.title}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
