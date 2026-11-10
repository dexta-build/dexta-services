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
import { getWhatsAppHref } from "@/lib/site/page-context";
import { STOCK, stock } from "@/lib/site/stock-media";
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
      getWhatsAppHref("Hello Dexta, I read one of your articles and..."),
    ],
  );
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();
  const count = posts.filter((p) => p.category?.slug === slug).length;

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
            {count} {count === 1 ? "article" : "articles"}
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
        title="Got a project in mind? *Let's talk*"
        body="Tell us what you're working on and we'll share how we can help."
        image={stock(STOCK.teamLaptopCasual, 2000)}
        whatsappHref={whatsappHref}
      />
    </main>
  );
}
