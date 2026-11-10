import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccentText } from "@/components/site/accent-text";
import { Button } from "@/components/site/button";
import { ClosingCta } from "@/components/site/closing-cta";
import { Container } from "@/components/site/container";
import { Eyebrow } from "@/components/site/eyebrow";
import { Heading } from "@/components/site/heading";
import { MediaAsset } from "@/components/site/media-asset";
import { Section } from "@/components/site/section";
import {
  ShareButtons,
  TableOfContents,
} from "@/components/site/thoughts/article-tools";
import { AuthorAvatar } from "@/components/site/thoughts/author-avatar";
import { PostCard, formatPostDate } from "@/components/site/thoughts/post-card";
import { getWhatsAppHref } from "@/lib/site/page-context";
import { STOCK, stock } from "@/lib/site/stock-media";
import { getThought } from "@/lib/site/thoughts-data";

type Params = { slug: string };

const plain = (title: string) => title.replace(/\*/g, "");

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const found = await getThought(slug);
  if (!found) return {};
  const { post } = found;
  const title = post.seoTitle ?? plain(post.title);
  const description = post.seoDescription ?? post.excerpt;
  return {
    alternates: { canonical: `/thoughts/${slug}` },
    title,
    description,
    openGraph: {
      type: "article",
      title,
      description,
      publishedTime: post.publishedAt,
      authors: post.author ? [post.author.name] : undefined,
      images: [{ url: post.cover }],
    },
  };
}

export default async function ThoughtPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const [found, whatsappHref] = await Promise.all([
    getThought(slug),
    getWhatsAppHref("Hello Dexta, I read one of your articles and..."),
  ]);
  if (!found) notFound();
  const { post, related } = found;
  const path = `/thoughts/${post.slug}`;

  const helpCard = (
    <div
      data-surface={post.category?.surface ?? "ice"}
      className="bg-surface text-surface-fg flex flex-col gap-3 rounded-[10px] p-6"
    >
      <p className="dx-heading text-h3 leading-tight">
        <AccentText text="Need a hand with *this*?" />
      </p>
      <p className="text-surface-muted text-sm leading-relaxed">
        Our team can design, build or print it for you.
      </p>
      <Button
        href={whatsappHref ?? "/contact"}
        external={Boolean(whatsappHref)}
        block
        arrow
        className="mt-2"
      >
        Talk to us
      </Button>
    </div>
  );

  return (
    <main className="dx-site">
      <article>
        {/* Title block */}
        <header className="bg-canvas">
          <Container className="flex max-w-4xl flex-col items-center gap-6 pt-12 pb-10 text-center md:pt-16 md:pb-14">
            <p className="text-eyebrow text-surface-muted flex flex-wrap items-center justify-center gap-x-2">
              <time dateTime={post.publishedAt}>
                {formatPostDate(post.publishedAt)}
              </time>
              {post.category && (
                <>
                  <span aria-hidden>•</span>
                  <Link
                    href={`/thoughts/category/${post.category.slug}`}
                    className="dx-link hover:text-surface-fg"
                  >
                    {post.category.name}
                  </Link>
                </>
              )}
            </p>
            <Heading
              size="h1"
              as="h1"
              className="md:text-[3.25rem] md:leading-[1.08]"
            >
              <AccentText text={post.title} />
            </Heading>
            {post.author && (
              <p className="flex items-center gap-3 text-sm">
                <AuthorAvatar
                  name={post.author.name}
                  src={post.author.avatar}
                  size={40}
                />
                <span>
                  By <strong>{post.author.name}</strong>{" "}
                  <span className="text-surface-muted">{post.author.role}</span>
                </span>
              </p>
            )}
            <ShareButtons title={plain(post.title)} path={path} />
          </Container>
        </header>

        {/* Body: sticky side column + article, like Superside */}
        <Container className="grid gap-10 pb-16 md:pb-24 lg:grid-cols-[15rem_1fr] lg:gap-14 xl:grid-cols-[17rem_1fr] xl:gap-20">
          <div className="hidden lg:block">
            <div className="sticky top-28 flex flex-col gap-8">
              <TableOfContents items={post.toc} />
              {helpCard}
            </div>
          </div>

          <div className="min-w-0 max-w-3xl">
            <div className="bg-surface-fg/5 relative aspect-[16/9] overflow-hidden rounded-[10px]">
              <MediaAsset
                media={{ kind: "image", src: post.cover, alt: "" }}
                sizes="(min-width: 1024px) 760px, 100vw"
                priority
              />
            </div>

            <div className="border-surface-rule mt-10 border-b pb-8">
              <p className="text-eyebrow text-surface-muted">TL;DR</p>
              <p className="mt-3 text-lg leading-relaxed md:text-xl">
                {post.excerpt}
              </p>
            </div>

            <div
              className="dx-article mt-8"
              // Sanitised in thoughts-data (renderArticle).
              dangerouslySetInnerHTML={{ __html: post.html }}
            />

            {post.tags.length > 0 && (
              <ul className="mt-10 flex flex-wrap gap-2">
                {post.tags.map((t) => (
                  <li
                    key={t}
                    className="border-surface-fg/20 rounded-full border px-3 py-1 text-xs"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            )}

            <div className="border-surface-rule mt-12 flex flex-col gap-6 border-t pt-8 sm:flex-row sm:items-center sm:justify-between">
              {post.author ? (
                <div className="flex items-center gap-4">
                  <AuthorAvatar
                    name={post.author.name}
                    src={post.author.avatar}
                    size={56}
                  />
                  <div>
                    <p className="text-surface-muted text-xs">Written by</p>
                    <p className="font-bold">{post.author.name}</p>
                    <p className="text-surface-muted text-sm">
                      {post.author.role}
                    </p>
                  </div>
                </div>
              ) : (
                <span />
              )}
              <ShareButtons title={plain(post.title)} path={path} />
            </div>

            <div className="mt-10 lg:hidden">{helpCard}</div>
          </div>
        </Container>
      </article>

      {related.length > 0 && (
        <Section surface="white">
          <Container>
            <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col gap-3">
                <Eyebrow>Keep reading</Eyebrow>
                <Heading size="h2">
                  <AccentText text="More *thoughts*" />
                </Heading>
              </div>
              <Link
                href="/thoughts"
                className="dx-link self-start text-sm font-bold md:self-auto"
              >
                See all thoughts
              </Link>
            </div>
            <div className="grid gap-x-6 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
              {related.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
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
