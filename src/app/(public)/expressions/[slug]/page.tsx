import { EXPRESSION_TEMPLATE } from "@/lib/content/pages/templates";
import { loadPage } from "@/lib/content/store";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Check, ChevronRight } from "lucide-react";
import { AccentText } from "@/components/site/accent-text";
import { Button } from "@/components/site/button";
import { ClosingCta } from "@/components/site/closing-cta";
import { Container } from "@/components/site/container";
import {
  BrowserFrame,
  PhoneFrame,
} from "@/components/site/expressions/device-frames";
import { Heading } from "@/components/site/heading";
import {
  ShareButtons,
  TableOfContents,
} from "@/components/site/thoughts/article-tools";
import { getExpression, getExpressions } from "@/lib/site/expressions-data";
import { getWhatsApp } from "@/lib/content/site-settings";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return (await getExpressions()).map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const found = await getExpression(slug);
  if (!found) return {};
  const { expression: e } = found;
  return {
    alternates: { canonical: `/expressions/${slug}` },
    title: `${e.name} · Our Expressions`,
    description: e.description,
    openGraph: {
      title: e.name,
      description: e.description,
      images: [{ url: e.cover }],
    },
  };
}

/** A product story, laid out like Superside's customer stories. */
export default async function ExpressionPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const [found, whatsappHref] = await Promise.all([
    getExpression(slug),
    getWhatsApp("expressions"),
  ]);
  if (!found) notFound();
  const { expression: e, html, toc, next } = found;

  const { data: templateContent } = await loadPage(EXPRESSION_TEMPLATE);
  const labels = templateContent.labels;
  const visit = labels.visitLabel.replace("{host}", e.host);

  const visitCard = (
    <div
      data-surface={e.surface}
      className="bg-surface text-surface-fg flex flex-col gap-3 rounded-[10px] p-6"
    >
      <p className="text-eyebrow text-surface-muted">{labels.visitEyebrow}</p>
      <p className="text-h3 leading-tight">{e.name}</p>
      <Button href={e.websiteUrl} external block arrow className="mt-2">
        {visit}
      </Button>
    </div>
  );

  return (
    <main className="dx-site">
      <article>
        <header className="bg-canvas">
          <Container className="flex max-w-4xl flex-col items-center gap-6 pt-10 pb-10 text-center md:pt-14 md:pb-14">
            <nav aria-label="Breadcrumb">
              <ol className="text-surface-muted flex items-center gap-1 text-sm">
                <li>
                  <Link
                    href="/expressions"
                    className="dx-link hover:text-surface-fg"
                  >
                    Our Expressions
                  </Link>
                </li>
                <li className="flex items-center gap-1">
                  <ChevronRight aria-hidden className="size-3.5" />
                  <span aria-current="page">{e.name}</span>
                </li>
              </ol>
            </nav>
            <p className="text-eyebrow text-surface-muted">{e.category}</p>
            <Heading
              size="h1"
              as="h1"
              className="md:text-[3.25rem] md:leading-[1.08]"
            >
              {e.name}: <AccentText text={e.tagline} />
            </Heading>
            <p className="text-lead text-surface-muted max-w-2xl">
              {e.description}
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <Button href={e.websiteUrl} external arrow>
                {visit}
              </Button>
              <ShareButtons
                title={`${e.name} by Dexta`}
                path={`/expressions/${e.slug}`}
              />
            </div>
          </Container>
        </header>

        {/* Product visual in its colour */}
        <div data-surface={e.surface} className="bg-surface">
          <Container className="relative max-w-6xl pt-10 pb-16 md:pt-14 md:pb-24">
            <BrowserFrame
              src={e.cover}
              host={e.host}
              alt={`${e.name} website`}
              priority
              sizes="(min-width: 1280px) 1100px, 100vw"
            />
            {e.mobile && (
              <PhoneFrame
                src={e.mobile}
                alt={`${e.name} on a phone`}
                className="absolute right-6 -bottom-6 w-[24%] max-w-[210px] md:right-10 md:-bottom-10"
              />
            )}
          </Container>
        </div>

        <Container className="grid gap-10 py-16 md:py-24 lg:grid-cols-[15rem_1fr] lg:gap-14 xl:grid-cols-[17rem_1fr] xl:gap-20">
          <div className="hidden lg:block">
            <div className="sticky top-28 flex flex-col gap-8">
              <TableOfContents items={toc} />
              {visitCard}
            </div>
          </div>

          <div className="min-w-0 max-w-3xl">
            {e.facts.length > 0 && (
              <dl
                data-surface={
                  e.surface === "brand" || e.surface === "royal"
                    ? "ice"
                    : "mint"
                }
                className="bg-surface text-surface-fg grid gap-6 rounded-[10px] p-6 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-[var(--surface-rule)] md:p-8"
              >
                {e.facts.map((f) => (
                  <div
                    key={f.label}
                    className="flex flex-col gap-2 sm:px-6 sm:first:pl-0 sm:last:pr-0"
                  >
                    <dt className="sr-only">{f.label}</dt>
                    <dd className="text-[2.25rem] leading-none font-bold tracking-tight">
                      {f.value}
                    </dd>
                    <dd className="text-sm leading-snug font-bold">
                      {f.label}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            <div
              className="dx-article mt-4"
              // Sanitised in thoughts-data (renderArticle).
              dangerouslySetInnerHTML={{ __html: html }}
            />

            {e.gallery.length > 0 && (
              <section
                aria-label={labels.galleryTitle}
                className="border-surface-rule mt-12 border-t pt-8"
              >
                <p className="text-eyebrow text-surface-muted">
                  {labels.galleryTitle}
                </p>
                <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                  {e.gallery.map((src, i) => (
                    <li
                      key={src}
                      className={
                        e.gallery.length % 2 === 1 && i === 0
                          ? "sm:col-span-2"
                          : undefined
                      }
                    >
                      <a
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-canvas block overflow-hidden rounded-[10px] outline-offset-4"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- screenshots from any host, any shape */}
                        <img
                          src={src}
                          alt={`${e.name} screenshot ${i + 1} of ${e.gallery.length}`}
                          loading="lazy"
                          decoding="async"
                          className="h-auto w-full transition-transform duration-500 hover:scale-[1.02]"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {e.features.length > 0 && (
              <div className="border-surface-rule mt-12 border-t pt-8">
                <p className="text-eyebrow text-surface-muted">
                  {labels.featuresTitle}
                </p>
                <ul className="mt-4 grid gap-x-8 sm:grid-cols-2">
                  {e.features.map((f) => (
                    <li
                      key={f}
                      className="border-surface-rule flex items-start gap-3 border-b py-3 text-sm"
                    >
                      <Check
                        aria-hidden
                        className="text-brand mt-0.5 size-4 shrink-0"
                      />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-10 lg:hidden">{visitCard}</div>
          </div>
        </Container>
      </article>

      {next && (
        <Link
          href={`/expressions/${next.slug}`}
          data-surface={next.surface}
          className="group bg-surface text-surface-fg block"
        >
          <Container className="flex flex-col gap-3 py-14 md:flex-row md:items-end md:justify-between md:py-20">
            <div className="flex flex-col gap-3">
              <p className="text-eyebrow text-surface-muted">
                {labels.nextEyebrow}
              </p>
              <p className="text-h1">{next.name}</p>
              <p className="dx-heading text-h3">
                <AccentText text={next.tagline} />
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-bold">
              {labels.nextLabel}
              <ArrowUpRight
                aria-hidden
                className="size-5 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
              />
            </span>
          </Container>
        </Link>
      )}

      <ClosingCta
        content={templateContent.closing}
        whatsappHref={whatsappHref}
      />
    </main>
  );
}

export const dynamicParams = true;
