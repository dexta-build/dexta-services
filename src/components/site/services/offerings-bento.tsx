import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccentText } from "../accent-text";
import { Container } from "../container";
import { Eyebrow } from "../eyebrow";
import { Heading } from "../heading";
import { RevealGroup, RevealItem } from "../reveal";
import { Section, type Surface } from "../section";
import type { Offering } from "@/lib/site/services-content";
import { stock } from "@/lib/site/stock-media";

/**
 * Bento of photo cards with the title and description over the top of the
 * image (Superside's "Designed to impress in every format" and the
 * services overview). Desktop rhythm: four across, then a wide card;
 * tablet: two across; phone: one column.
 */
const SPANS_DESKTOP = [
  "",
  "",
  "",
  "",
  "lg:col-span-2",
  "lg:col-span-2",
  "",
  "lg:col-span-2",
  "",
];

export function OfferingsBento({
  eyebrow,
  title,
  body,
  items,
  surface = "canvas",
  centred = true,
}: {
  eyebrow?: string;
  title?: string;
  body?: string;
  items: Offering[];
  surface?: Surface;
  centred?: boolean;
}) {
  return (
    <Section surface={surface}>
      <Container>
        {title && (
          <div
            className={cn(
              "flex max-w-3xl flex-col gap-4",
              centred && "mx-auto items-center text-center",
            )}
          >
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            <Heading size="h1">
              <AccentText text={title} />
            </Heading>
            {body && (
              <p className="text-surface-muted max-w-xl leading-relaxed">
                {body}
              </p>
            )}
          </div>
        )}
        <BentoGrid
          items={items}
          className={title ? "mt-10 md:mt-14" : undefined}
        />
      </Container>
    </Section>
  );
}

export function BentoGrid({
  items,
  className,
  columns = 4,
}: {
  items: Offering[];
  className?: string;
  /** 3 = simple row of equal cards (no wide cards). */
  columns?: 3 | 4;
}) {
  return (
    <RevealGroup
      className={cn(
        "grid auto-rows-[20rem] gap-3 md:gap-4 lg:auto-rows-[24rem]",
        columns === 4 ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3",
        className,
      )}
    >
      {items.map((item, i) => (
        <RevealItem
          key={item.title}
          className={
            columns === 4 ? SPANS_DESKTOP[i % SPANS_DESKTOP.length] : undefined
          }
        >
          <OfferingCard item={item} />
        </RevealItem>
      ))}
    </RevealGroup>
  );
}

function OfferingCard({ item }: { item: Offering }) {
  const inner = (
    <>
      <Image
        src={stock(item.image, 900, 900)}
        alt=""
        fill
        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
        className="object-cover transition-transform duration-700 ease-(--ease-out-expo) group-hover:scale-105"
      />
      <span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-black/40"
      />
      <span className="relative flex h-full flex-col p-5 text-white md:p-6">
        <span className="text-h3 font-bold">{item.title}</span>
        <span className="mt-2 max-w-xs text-sm leading-relaxed text-white/85">
          {item.description}
        </span>
        {item.href && (
          <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-bold">
            <span className="dx-link">Learn more</span>
            <ArrowUpRight
              aria-hidden
              className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </span>
        )}
      </span>
    </>
  );
  const cls =
    "group relative block h-full overflow-hidden rounded-[10px] bg-royal";
  return item.href ? (
    <Link href={item.href} className={cls} data-cursor="View">
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}
