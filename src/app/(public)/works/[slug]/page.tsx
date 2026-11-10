import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/site/button";
import { ClosingCta } from "@/components/site/closing-cta";
import { Container } from "@/components/site/container";
import { Eyebrow } from "@/components/site/eyebrow";
import { Heading } from "@/components/site/heading";
import { MediaAsset } from "@/components/site/media-asset";
import { Reveal } from "@/components/site/reveal";
import { Section } from "@/components/site/section";
import { TagChip } from "@/components/site/tag-chip";
import { MoreWorks } from "@/components/site/works/more-works";
import { WorkGalleryGrid } from "@/components/site/works/work-gallery-grid";
import { getWhatsAppHref } from "@/lib/site/page-context";
import { STOCK, stock } from "@/lib/site/stock-media";
import { getWork, getWorks, PILLAR_LABEL } from "@/lib/site/works-data";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return (await getWorks()).map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const work = await getWork(slug);
  if (!work) return {};
  const cover = work.media.find((m) => m.kind === "image");
  return {
    alternates: { canonical: `/works/${slug}` },
    title: work.title,
    description:
      work.description || `${work.title}: a ${work.category} project by Dexta.`,
    openGraph: cover ? { images: [{ url: cover.src }] } : undefined,
  };
}

/** A single project page (linked from every Works tile, good for SEO and sharing). */
export default async function WorkPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const [work, works] = await Promise.all([getWork(slug), getWorks()]);
  if (!work) notFound();

  const whatsappHref = await getWhatsAppHref(
    `Hello Dexta, I saw "${work.title}" and I'd like something similar.`,
  );
  // Other projects: same service first.
  const more = [
    ...works.filter((w) => w.id !== work.id && w.pillar === work.pillar),
    ...works.filter((w) => w.id !== work.id && w.pillar !== work.pillar),
  ];
  const [cover, ...rest] = work.media;
  const serviceHref = `/services/${work.pillar.toLowerCase()}`;

  return (
    <main className="dx-site">
      <Section spacing="sm" className="pt-10 md:pt-14">
        <Container>
          <nav aria-label="Breadcrumb">
            <ol className="text-surface-muted flex flex-wrap items-center gap-1 text-sm">
              <li>
                <Link href="/works" className="dx-link hover:text-surface-fg">
                  Works
                </Link>
              </li>
              <li className="flex items-center gap-1">
                <ChevronRight aria-hidden className="size-3.5" />
                <span aria-current="page">{work.title}</span>
              </li>
            </ol>
          </nav>

          <div className="mt-8 grid items-end gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
            <div className="flex flex-col gap-5">
              <Eyebrow>{work.category}</Eyebrow>
              <Heading
                size="display"
                as="h1"
                className="font-[family-name:var(--font-accent)] italic"
              >
                {work.title}
              </Heading>
            </div>
            <div className="flex flex-col gap-5">
              {work.description && (
                <p className="text-lead text-surface-muted">
                  {work.description}
                </p>
              )}
              {work.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Link href={serviceHref}>
                    <TagChip tone="solid" size="md">
                      {PILLAR_LABEL[work.pillar]}
                    </TagChip>
                  </Link>
                  {work.tags.map((t) => (
                    <TagChip key={t} tone="outline" size="md">
                      {t}
                    </TagChip>
                  ))}
                </div>
              )}
              <div className="flex flex-col gap-3 md:flex-row">
                <Button href="/contact" size="lg" block="mobile" arrow>
                  Start a similar project
                </Button>
                {work.websiteUrl && (
                  <Button
                    href={work.websiteUrl}
                    external
                    variant="outline"
                    size="lg"
                    block="mobile"
                  >
                    Visit website
                  </Button>
                )}
              </div>
            </div>
          </div>

          {cover && (
            <Reveal className="mt-10 md:mt-14">
              <div className="bg-royal relative aspect-[4/3] overflow-hidden rounded-[10px] md:aspect-[16/8]">
                <MediaAsset media={cover} priority sizes="100vw" />
              </div>
            </Reveal>
          )}
        </Container>
      </Section>

      {rest.length > 0 && (
        <Section spacing="sm" className="pt-0 md:pt-0 xl:pt-0">
          <Container>
            <WorkGalleryGrid media={rest} title={work.title} />
          </Container>
        </Section>
      )}

      <MoreWorks works={more} />

      <ClosingCta
        variant="card"
        title="Want something *like this*?"
        body="Tell us what you're planning and we'll make it yours."
        image={stock(STOCK.teamWhiteboard, 1800, 900)}
        whatsappHref={whatsappHref}
      />
    </main>
  );
}
