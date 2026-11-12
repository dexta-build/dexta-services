import type { Metadata } from "next";
import { AccentText } from "@/components/site/accent-text";
import { Button } from "@/components/site/button";
import { ClosingCta } from "@/components/site/closing-cta";
import { Container } from "@/components/site/container";
import { Eyebrow } from "@/components/site/eyebrow";
import { Heading } from "@/components/site/heading";
import { RevealGroup, RevealItem } from "@/components/site/reveal";
import { Section } from "@/components/site/section";
import { PostCard } from "@/components/site/thoughts/post-card";
import {
  ThoughtsBrowser,
  type ThoughtSort,
} from "@/components/site/thoughts/thoughts-browser";
import { TrendingBand } from "@/components/site/thoughts/trending-band";
import { THOUGHTS_PAGE } from "@/lib/content/pages/main";
import { pageMetadata } from "@/lib/content/seo";
import { getWhatsApp } from "@/lib/content/site-settings";
import { loadPage } from "@/lib/content/store";
import { getThoughtCategories, getThoughts } from "@/lib/site/thoughts-data";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(THOUGHTS_PAGE);
}

type Search = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function ThoughtsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const [search, posts, categories, whatsappHref] = await Promise.all([
    searchParams,
    getThoughts(),
    getThoughtCategories(),
    getWhatsApp("thoughts"),
  ]);
  const { data: c, hidden } = await loadPage(THOUGHTS_PAGE);

  // Two featured stories (admin-flagged first, then the newest).
  const featured = [
    ...posts.filter((p) => p.featured),
    ...posts.filter((p) => !p.featured),
  ].slice(0, 2);

  // Trending: the category with the most stories (needs 2+).
  const trending = categories
    .map((c) => ({
      category: c,
      posts: posts.filter((p) => p.category?.slug === c.slug),
    }))
    .sort((a, b) => b.posts.length - a.posts.length)[0];

  return (
    <main className="dx-site">
      <Section spacing="sm" className="pt-12 md:pt-16">
        <Container className="flex flex-col items-center gap-5 text-center">
          {c.hero.eyebrow && <Eyebrow>{c.hero.eyebrow}</Eyebrow>}
          <Heading size="display" as="h1">
            <AccentText text={c.hero.title} />
          </Heading>
          <p className="text-lead text-surface-muted max-w-2xl">
            {c.hero.body}
          </p>
        </Container>

        {featured.length > 0 && (
          <Container className="mt-12 md:mt-16">
            <RevealGroup className="grid gap-12 md:grid-cols-2 md:gap-6 lg:gap-8">
              {featured.map((p, i) => (
                <RevealItem key={p.id}>
                  <PostCard
                    post={p}
                    size="lg"
                    showAuthor
                    priority={i === 0}
                    readLabel={c.browse.readTime}
                  />
                </RevealItem>
              ))}
            </RevealGroup>
          </Container>
        )}
      </Section>

      {trending && trending.posts.length >= 2 && (
        <TrendingBand
          category={trending.category}
          posts={trending.posts}
          label={c.browse.trending}
          readLabel={c.browse.readTime}
        />
      )}

      {posts.length === 0 ? (
        <Section spacing="sm">
          <Container>
            <div
              data-surface="ice"
              className="bg-surface text-surface-fg mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-[10px] px-6 py-14 text-center md:py-20"
            >
              <p className="text-h2">
                <AccentText text={c.empty.title} />
              </p>
              <p className="text-surface-muted max-w-md leading-relaxed">
                {c.empty.body}
              </p>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                {c.empty.primary.label && c.empty.primary.href && (
                  <Button href={c.empty.primary.href} arrow>
                    {c.empty.primary.label}
                  </Button>
                )}
                {c.empty.secondary.label && c.empty.secondary.href && (
                  <Button href={c.empty.secondary.href} variant="outline">
                    {c.empty.secondary.label}
                  </Button>
                )}
              </div>
            </div>
          </Container>
        </Section>
      ) : (
        <Section id="all-thoughts" className="scroll-mt-24">
          <Container>
            <Heading size="h2" className="mb-8 text-center md:mb-10">
              {c.browse.allTitle}
            </Heading>
            <ThoughtsBrowser
              posts={posts}
              categories={categories}
              basePath="/thoughts"
              labels={c.browse}
              initialQuery={one(search.q) ?? ""}
              initialSort={
                (one(search.sort) === "oldest"
                  ? "oldest"
                  : "latest") as ThoughtSort
              }
            />
          </Container>
        </Section>
      )}

      {!hidden.closing && (
        <ClosingCta content={c.closing} whatsappHref={whatsappHref} />
      )}
    </main>
  );
}
