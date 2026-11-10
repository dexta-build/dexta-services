import { BrandMark } from "../brand-mark";
import { AccentText } from "../accent-text";
import { Container } from "../container";
import { Eyebrow } from "../eyebrow";
import { Heading } from "../heading";
import { RevealGroup, RevealItem } from "../reveal";
import { Section } from "../section";
import type { WorkBrand } from "@/lib/site/works-data";

/**
 * A wall of logos: Dexta's own products first (marked "Built by Dexta"),
 * then clients. Hidden when there's nothing to show.
 */
export function BrandsWall({ brands }: { brands: WorkBrand[] }) {
  if (brands.length === 0) return null;
  return (
    <Section surface="white">
      <Container>
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <Eyebrow>Products & clients</Eyebrow>
          <Heading size="h1">
            <AccentText text="Brands we've *built and worked with*" />
          </Heading>
        </div>
        <RevealGroup className="border-surface-rule mt-12 grid grid-cols-2 border-t border-l md:grid-cols-3 lg:grid-cols-4">
          {brands.map((brand) => (
            <RevealItem
              key={brand.id}
              className="border-surface-rule border-r border-b"
            >
              <a
                href={brand.url || undefined}
                target={brand.url?.startsWith("http") ? "_blank" : undefined}
                rel={
                  brand.url?.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
                aria-label={brand.name}
                className="group relative flex h-32 flex-col items-center justify-center gap-2 p-6 text-center transition-opacity hover:opacity-70 md:h-40"
              >
                <BrandMark
                  brand={brand}
                  className="max-w-full text-center whitespace-normal"
                />
                {brand.kind === "product" && (
                  <span className="text-surface-muted text-[0.6875rem] font-bold tracking-[0.08em] uppercase">
                    Built by Dexta
                  </span>
                )}
              </a>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </Section>
  );
}
