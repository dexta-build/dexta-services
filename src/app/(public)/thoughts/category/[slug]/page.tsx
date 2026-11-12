import { ARTICLE_TEMPLATE } from "@/lib/content/pages/templates";
import { loadPage } from "@/lib/content/store";
import { THOUGHTS_PAGE } from "@/lib/content/pages/main";
import { fillIn } from "@/lib/site/thoughts-labels";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ClosingCta } from "@/components/site/closing-cta";
import { Container } from "@/components/site/container";
import { Eyebrow } from "@/components/site/eyebrow";
import { Heading } from "@/components/site/heading";
import { Section } from "@/components/site/section";
import {
  ThoughtsBrowser,
  type ThoughtSort,
} from "@/components/site/thoughts/thoughts-browser";
import { getWhatsApp } from "@/lib/content/site-settings";
import { getThoughtCategories, getThoughts } from "@/lib/site/thoughts-data";

type Params = { slug: string };
type Search = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = (await getThoughtCategories()).find((c) => c.slug === slug);
  if (!category) return {};
  return {
    alternates: { canonical: `/thoughts/category/${slug}` },
    title: `${category.name} · Thoughts`,
    description:
      category.description ??
      `Articles about ${category.name.toLowerCase()} from the Dexta team.`,
  };
}

export default async function ThoughtCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const [{ slug }, search, posts, categories, whatsappHref] = await Promise.all(
    [
      params,
      searchParams,
      getThoughts(),
      getThoughtCategories(),
      getWhatsApp("thoughts"),
    ],
  );
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();
  const count = posts.filter((p) => p.category?.slug === slug).length;

  const [{ data: templateContent }, { data: thoughtsPage }] = await Promise.all(
    [loadPage(ARTICLE_TEMPLATE), loadPage(THOUGHTS_PAGE)],
  );
  const L = thoughtsPage.browse;
  return (
    <main className="dx-site">
      <section
        data-surface={category.surface}
        className="bg-surface text-surface-fg"
      >
        <Container className="flex flex-col gap-5 pt-10 pb-12 md:pt-14 md:pb-16">
          <nav aria-label="Breadcrumb">
            <ol className="text-surface-muted flex items-center gap-1 text-sm">
              <li>
                <Link
                  href="/thoughts"
                  className="dx-link hover:text-surface-fg"
                >
                  Thoughts
                </Link>
              </li>
              <li className="flex items-center gap-1">
                <ChevronRight aria-hidden className="size-3.5" />
                <span aria-current="page">{category.name}</span>
              </li>
            </ol>
          </nav>
          <Eyebrow>
            {fillIn(count === 1 ? L.articleOne : L.articleMany, { count })}
          </Eyebrow>
          <Heading size="display" as="h1">
            <em>{category.name}</em>
          </Heading>
          {category.description && (
            <p className="text-lead text-surface-muted max-w-2xl">
              {category.description}
            </p>
          )}
        </Container>
      </section>

      <Section>
        <Container>
          <ThoughtsBrowser
            posts={posts}
            categories={categories}
            basePath={`/thoughts/category/${slug}`}
            lockedCategory={slug}
            labels={L}
            initialQuery={one(search.q) ?? ""}
            initialSort={
              (one(search.sort) === "oldest"
                ? "oldest"
                : "latest") as ThoughtSort
            }
          />
        </Container>
      </Section>

      <ClosingCta
        content={templateContent.closing}
        whatsappHref={whatsappHref}
      />
    </main>
  );
}
