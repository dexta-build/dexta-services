import type { Metadata } from "next";
import { AccentText } from "@/components/site/accent-text";
import { ClosingCta } from "@/components/site/closing-cta";
import { Container } from "@/components/site/container";
import { Eyebrow } from "@/components/site/eyebrow";
import { Heading } from "@/components/site/heading";
import { LogoStrip } from "@/components/site/home/logo-strip";
import { ShowreelTeaser } from "@/components/site/home/showreel-teaser";
import { Reveal } from "@/components/site/reveal";
import { Section } from "@/components/site/section";
import { BrandsWall } from "@/components/site/works/brands-wall";
import {
  WorksGallery,
  type WorksFilter,
} from "@/components/site/works/works-gallery";
import { WORKS_PAGE } from "@/lib/content/pages/main";
import { pageMetadata } from "@/lib/content/seo";
import { getWhatsApp } from "@/lib/content/site-settings";
import { loadPage } from "@/lib/content/store";
import { stock } from "@/lib/site/stock-media";
import { getBrands, getWorks } from "@/lib/site/works-data";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(WORKS_PAGE);
}

const FILTERS: WorksFilter[] = ["all", "design", "build", "print"];

function toFilter(value: string | string[] | undefined): WorksFilter {
  const v = (Array.isArray(value) ? value[0] : value)?.toLowerCase();
  return FILTERS.includes(v as WorksFilter) ? (v as WorksFilter) : "all";
}

export default async function WorksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  // ?service= is the new name; ?tab= keeps old /projects links working.
  const initialFilter = toFilter(params.service ?? params.tab);

  const [works, brands, whatsappHref, { data: c, hidden }] = await Promise.all([
    getWorks(),
    getBrands(),
    getWhatsApp("works"),
    loadPage(WORKS_PAGE),
  ]);

  const teaserImages = works
    .flatMap((w) => w.media.filter((m) => m.kind === "image").slice(0, 1))
    .slice(0, 6)
    .map((m) => m.src);

  return (
    <main className="dx-site">
      {/* Hero: title, then a wide showreel teaser */}
      <Section spacing="sm" className="pt-12 md:pt-16">
        <Container>
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="flex max-w-3xl flex-col gap-5">
              {c.hero.eyebrow && <Eyebrow>{c.hero.eyebrow}</Eyebrow>}
              <Heading size="display" as="h1">
                <AccentText text={c.hero.title} />
              </Heading>
            </div>
            <p className="text-lead text-surface-muted max-w-md">
              {c.hero.body}
            </p>
          </div>
          <Reveal className="mt-10 md:mt-14">
            <ShowreelTeaser
              words={c.hero.words}
              images={
                teaserImages.length >= 3
                  ? teaserImages
                  : c.hero.images.map((id) => stock(id, 900, 900))
              }
              video={c.hero.video}
              className="aspect-[4/3] md:aspect-[21/9]"
            />
          </Reveal>
        </Container>
      </Section>

      {/* Statement + client logos */}
      {!hidden.statement && (
        <Section spacing="sm" className="pb-0 md:pb-0 xl:pb-0">
          <Container size="narrow" className="text-center">
            <Heading size="h2" as="p">
              <AccentText text={c.statement.text} />
            </Heading>
          </Container>
        </Section>
      )}
      <LogoStrip brands={brands} />

      <div className="pt-16 md:pt-20">
        <WorksGallery
          works={works}
          initialFilter={initialFilter}
          labels={c.projects}
        />
      </div>

      {!hidden.brands && <BrandsWall brands={brands} content={c.brands} />}

      {!hidden.closing && (
        <ClosingCta content={c.closing} whatsappHref={whatsappHref} />
      )}
    </main>
  );
}
