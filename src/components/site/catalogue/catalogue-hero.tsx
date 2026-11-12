import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AccentText } from "../accent-text";
import { Container } from "../container";
import { Eyebrow } from "../eyebrow";
import { Heading } from "../heading";
import { Marquee } from "../marquee";
import type { CatalogueData } from "@/lib/site/catalogue-data";
import { CATALOGUE_HERO_LABELS, fill } from "@/lib/site/catalogue-labels";

/**
 * A catalogue's hero in its own colour (gold for Wedding, coral for Events…)
 * with a sliding row of its categories, each linking to that filter.
 */
export function CatalogueHero({
  catalogue,
  labels = CATALOGUE_HERO_LABELS,
}: {
  catalogue: CatalogueData;
  labels?: typeof CATALOGUE_HERO_LABELS;
}) {
  const title =
    catalogue.heroTitle || fill(labels.title, { catalogue: catalogue.title });
  const description = catalogue.description.trim().replace(/\.$/, "");
  const text =
    catalogue.heroText ||
    [description && `${description}.`, labels.line].filter(Boolean).join(" ");
  const chips = catalogue.categories.map((cat) => ({
    label: cat,
    image: catalogue.items.find(
      (i) => i.category === cat && i.media[0]?.kind === "image",
    )?.media[0]?.src,
  }));

  return (
    <section
      data-surface={catalogue.surface}
      className="bg-surface text-surface-fg relative overflow-hidden"
    >
      <Container className="grid gap-8 pt-10 pb-8 md:pt-14 lg:grid-cols-[1.3fr_1fr] lg:items-end lg:gap-12 lg:pb-12">
        <div className="flex flex-col gap-5">
          <nav aria-label="Breadcrumb">
            <ol className="text-surface-muted flex items-center gap-1 text-sm">
              <li>
                <Link
                  href="/catalogue"
                  className="dx-link hover:text-surface-fg"
                >
                  Catalogues
                </Link>
              </li>
              <li className="flex items-center gap-1">
                <ChevronRight aria-hidden className="size-3.5" />
                <span aria-current="page">{catalogue.title}</span>
              </li>
            </ol>
          </nav>
          {labels.eyebrow && <Eyebrow>{labels.eyebrow}</Eyebrow>}
          <Heading size="display" as="h1">
            <AccentText text={title} />
          </Heading>
          <p className="text-lead text-surface-muted max-w-xl">{text}</p>
        </div>
        <div className="relative hidden aspect-[4/3] overflow-hidden rounded-[10px] lg:block">
          <Image
            src={catalogue.image}
            alt=""
            fill
            priority
            fetchPriority="high"
            sizes="40vw"
            className="object-cover"
          />
        </div>
      </Container>

      {chips.length > 0 && (
        <Marquee
          duration={Math.max(28, chips.length * 6)}
          gap="0.75rem"
          pauseOnHover
          className="pb-8 md:pb-10"
        >
          {chips.map((chip) => (
            <Link
              key={chip.label}
              href={`${catalogue.href}?category=${encodeURIComponent(chip.label)}`}
              scroll={false}
              className="text-charcoal flex shrink-0 items-center gap-3 rounded-[10px] bg-white py-1.5 pr-4 pl-1.5 text-sm shadow-sm transition-transform hover:-translate-y-0.5"
            >
              {chip.image && (
                <span className="relative h-9 w-12 overflow-hidden rounded-md">
                  <Image
                    src={chip.image}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </span>
              )}
              {chip.label}
            </Link>
          ))}
        </Marquee>
      )}
    </section>
  );
}
