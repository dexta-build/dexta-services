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
import { getWhatsAppHref } from "@/lib/site/page-context";
import { SHOWREEL_VIDEO, STOCK, stock } from "@/lib/site/stock-media";
import { getBrands, getWorks } from "@/lib/site/works-data";

export const metadata: Metadata = {
  alternates: { canonical: "/works" },
  title: "Works",
  description:
    "Recent design, software and print projects by Dexta, for brands, businesses and life's big moments.",
};

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

  const [works, brands, whatsappHref] = await Promise.all([
    getWorks(),
    getBrands(),
    getWhatsAppHref(
      "Hello Dexta, I saw your work and I'd like to start a project.",
    ),
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
              <Eyebrow>Our work</Eyebrow>
              <Heading size="display" as="h1">
                <AccentText text="Work we're *proud to share*" />
              </Heading>
            </div>
            <p className="text-lead text-surface-muted max-w-md">
              Brand identities, websites, apps and beautiful print, made for
              businesses, families and the moments they care about.
            </p>
          </div>
          <Reveal className="mt-10 md:mt-14">
            <ShowreelTeaser
              words={["design", "build", "print"]}
              images={
                teaserImages.length >= 3
                  ? teaserImages
                  : [
                      STOCK.weddingCouple,
                      STOCK.designerTablet,
                      STOCK.developerScreens,
                      STOCK.goldRibbons,
                      STOCK.colourSwatches,
                      STOCK.eventStage,
                    ].map((id) => stock(id, 900, 900))
              }
              video={SHOWREEL_VIDEO}
              className="aspect-[4/3] md:aspect-[21/9]"
            />
          </Reveal>
        </Container>
      </Section>

      {/* Statement + client logos */}
      <Section spacing="sm" className="pb-0 md:pb-0 xl:pb-0">
        <Container size="narrow" className="text-center">
          <Heading size="h2" as="p">
            We help ambitious brands and families{" "}
            <em>make every moment count</em>, from first sketch to final
            delivery.
          </Heading>
        </Container>
      </Section>
      <LogoStrip brands={brands} />

      <div className="pt-16 md:pt-20">
        <WorksGallery works={works} initialFilter={initialFilter} />
      </div>

      <BrandsWall brands={brands} />

      <ClosingCta
        title="Love what you see? *Let's make yours next*"
        body="Tell us about your brand, event or idea. We'll take it from first sketch to finished piece."
        image={stock(STOCK.teamLaptopCasual, 2000)}
        whatsappHref={whatsappHref}
      />
    </main>
  );
}
