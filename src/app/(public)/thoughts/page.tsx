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
import { getWhatsAppHref } from "@/lib/site/page-context";
import { STOCK, stock } from "@/lib/site/stock-media";
import { getThoughtCategories, getThoughts } from "@/lib/site/thoughts-data";

export const metadata: Metadata = {
  alternates: { canonical: "/thoughts" },
  title: "Thoughts",
  description:
    "Ideas, guides and stories from the Dexta team on brand, design, software and print.",
};

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
    getWhatsAppHref("Hello Dexta, I read one of your articles and..."),
  ]);

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
          <Eyebrow>Our thoughts</Eyebrow>
          <Heading size="display" as="h1">
            <AccentText text="Ideas worth *sharing*" />
          </Heading>
          <p className="text-lead text-surface-muted max-w-2xl">
            Practical tips, behind-the-scenes stories and lessons from our work
            in brand, design, software and print.
          </p>
        </Container>

        {featured.length > 0 && (
          <Container className="mt-12 md:mt-16">
            <RevealGroup className="grid gap-12 md:grid-cols-2 md:gap-6 lg:gap-8">
              {featured.map((p, i) => (
                <RevealItem key={p.id}>
                  <PostCard post={p} size="lg" showAuthor priority={i === 0} />
                </RevealItem>
              ))}
            </RevealGroup>
          </Container>
        )}
      </Section>

      {trending && trending.posts.length >= 2 && (
        <TrendingBand category={trending.category} posts={trending.posts} />
      )}

      {posts.length === 0 ? (
        <Section spacing="sm">
          <Container>
            <div
              data-surface="ice"
              className="bg-surface text-surface-fg mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-[10px] px-6 py-14 text-center md:py-20"
            >
              <p className="text-h2">
                <AccentText text="Our first articles are *on the way*" />
              </p>
              <p className="text-surface-muted max-w-md leading-relaxed">
                The team is writing. In the meantime, see the products we build
                and the work we&apos;re proud of.
              </p>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <Button href="/works" arrow>
                  See our work
                </Button>
                <Button href="/expressions" variant="outline">
                  Our Expressions
                </Button>
              </div>
            </div>
          </Container>
        </Section>
      ) : (
        <Section id="all-thoughts" className="scroll-mt-24">
          <Container>
            <Heading size="h2" className="mb-8 text-center md:mb-10">
              All thoughts
            </Heading>
            <ThoughtsBrowser
              posts={posts}
              categories={categories}
              basePath="/thoughts"
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

      <ClosingCta
        title="Got a project in mind? *Let's talk*"
        body="Tell us what you're working on and we'll share how we can help."
        image={stock(STOCK.teamLaptopCasual, 2000)}
        whatsappHref={whatsappHref}
      />
    </main>
  );
}
