import type { Metadata } from "next";
import Link from "next/link";
import { AccentText } from "@/components/site/accent-text";
import { ClosingCta } from "@/components/site/closing-cta";
import { Container } from "@/components/site/container";
import { Eyebrow } from "@/components/site/eyebrow";
import { ExpressionPanel } from "@/components/site/expressions/expression-panel";
import { Heading } from "@/components/site/heading";
import { getExpressions } from "@/lib/site/expressions-data";
import { EXPRESSIONS_PAGE } from "@/lib/content/pages/main";
import { pageMetadata } from "@/lib/content/seo";
import { getWhatsApp } from "@/lib/content/site-settings";
import { loadPage } from "@/lib/content/store";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(EXPRESSIONS_PAGE);
}

export default async function ExpressionsPage() {
  const [expressions, whatsappHref] = await Promise.all([
    getExpressions(),
    getWhatsApp("expressions"),
  ]);
  const { data: c, hidden } = await loadPage(EXPRESSIONS_PAGE);

  return (
    <main className="dx-site">
      <section className="bg-canvas pt-12 pb-12 md:pt-16 md:pb-16">
        <Container className="flex max-w-4xl flex-col items-center gap-5 text-center">
          {c.hero.eyebrow && <Eyebrow>{c.hero.eyebrow}</Eyebrow>}
          <Heading size="display" as="h1">
            <AccentText text={c.hero.title} />
          </Heading>
          <p className="text-lead text-surface-muted max-w-2xl">
            {c.hero.body}
          </p>
          {expressions.length > 1 && (
            <nav
              aria-label="Products"
              className="mt-4 flex flex-wrap justify-center gap-2"
            >
              {expressions.map((e) => (
                <Link
                  key={e.slug}
                  href={`#${e.slug}`}
                  data-surface={e.surface}
                  className="bg-surface text-surface-fg rounded-full px-4 py-2 text-sm font-bold transition-transform hover:-translate-y-0.5"
                >
                  {e.name}
                </Link>
              ))}
            </nav>
          )}
        </Container>
      </section>

      {expressions.map((e, i) => (
        <ExpressionPanel key={e.slug} expression={e} index={i} />
      ))}

      {!hidden.closing && (
        <ClosingCta content={c.closing} whatsappHref={whatsappHref} />
      )}
    </main>
  );
}
