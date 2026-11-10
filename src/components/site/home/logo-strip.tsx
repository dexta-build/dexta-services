import { BrandMark } from "../brand-mark";
import { Container } from "../container";
import { Marquee } from "../marquee";
import type { BrandLogo } from "@/lib/site/brands-data";
import { HOME_LOGOS } from "@/lib/site/home-content";

/** Repeats a row until it's long enough to loop without a gap. */
function fillRow(items: BrandLogo[], min: number) {
  if (items.length === 0) return [];
  const out: { brand: BrandLogo; copy: boolean }[] = [];
  for (let i = 0; out.length < Math.max(min, items.length); i++) {
    out.push({ brand: items[i % items.length], copy: i >= items.length });
  }
  return out;
}

function Row({
  items,
  reverse,
  duration,
  gap = "4.5rem",
}: {
  items: { brand: BrandLogo; copy: boolean }[];
  reverse?: boolean;
  duration: number;
  gap?: string;
}) {
  return (
    <Marquee
      className="dx-mask-x-wide"
      reverse={reverse}
      duration={duration}
      gap={gap}
      pauseOnHover
      trackClassName="items-center"
    >
      {items.map(({ brand, copy }, i) => {
        const external = brand.url?.startsWith("http");
        return (
          <a
            key={`${brand.id}-${i}`}
            href={brand.url || undefined}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            aria-label={brand.name}
            aria-hidden={copy || undefined}
            tabIndex={copy ? -1 : undefined}
            className="flex h-12 shrink-0 items-center text-[13px] transition-opacity hover:opacity-70 md:text-base"
          >
            <BrandMark brand={brand} />
          </a>
        );
      })}
    </Marquee>
  );
}

/**
 * Superside's "Creative support for 400+ top global brands": a plain
 * centred sentence above sliding logos in one dark tone, fading out at the
 * edges. One row on phones; two rows moving in opposite directions from
 * tablet up. Our products and clients share the rows.
 */
export function LogoStrip({ brands }: { brands: BrandLogo[] }) {
  if (brands.length === 0) return null;

  // Two rows only when there are enough logos to fill both without the
  // same few repeating side by side.
  const twoRows = brands.length >= 8;
  const top = twoRows ? brands.filter((_, i) => i % 2 === 0) : brands;
  const bottom = twoRows ? brands.filter((_, i) => i % 2 === 1) : [];

  return (
    <section
      aria-label="Brands"
      className="bg-canvas text-charcoal pt-16 pb-11 md:pt-20 md:pb-14 lg:pt-32 lg:pb-[88px]"
    >
      <Container className="flex flex-col gap-10 md:gap-12 lg:gap-20">
        <h2 className="mx-auto max-w-[36rem] text-center text-xl leading-snug font-normal md:text-2xl">
          {HOME_LOGOS.title}
        </h2>

        {/* Phones: one row */}
        <div className="md:hidden">
          <Row
            items={fillRow(brands, 8)}
            duration={brands.length * 4 + 16}
            gap="2.75rem"
          />
        </div>

        {/* Tablet and up: two rows in opposite directions */}
        <div className="hidden flex-col gap-8 md:flex lg:gap-10">
          <Row items={fillRow(top, 7)} duration={45} />
          {bottom.length > 0 && (
            <Row items={fillRow(bottom, 7)} duration={50} reverse />
          )}
        </div>
      </Container>
    </section>
  );
}
