import type { Metadata } from "next";
import Link from "next/link";
import { AccentText } from "@/components/site/accent-text";
import { ClosingCta } from "@/components/site/closing-cta";
import { Container } from "@/components/site/container";
import { Eyebrow } from "@/components/site/eyebrow";
import { ExpressionPanel } from "@/components/site/expressions/expression-panel";
import { Heading } from "@/components/site/heading";
import { getExpressions } from "@/lib/site/expressions-data";
import { getWhatsAppHref } from "@/lib/site/page-context";
import { STOCK, stock } from "@/lib/site/stock-media";

export const metadata: Metadata = {
  alternates: { canonical: "/expressions" },
  title: "Our Expressions",
  description:
    "Products designed, built and run by Dexta: DX-SchoolPortal, BookPrinta, AwaMenu, DextaLearning and more.",
};

export default async function ExpressionsPage() {
  const [expressions, whatsappHref] = await Promise.all([
    getExpressions(),
    getWhatsAppHref("Hello Dexta, I have a product idea I'd like to build."),
  ]);

  return (
    <main className="dx-site">
      <section className="bg-canvas pt-12 pb-12 md:pt-16 md:pb-16">
        <Container className="flex max-w-4xl flex-col items-center gap-5 text-center">
          <Eyebrow>Our Expressions</Eyebrow>
          <Heading size="display" as="h1">
            <AccentText text="Products we *build* and run" />
          </Heading>
          <p className="text-lead text-surface-muted max-w-2xl">
            Our Expressions are products designed, built and run by Dexta.
            They&apos;re proof of what we can make for you, and they serve
            thousands of people every day.
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

      <ClosingCta
        title="Have a product idea? *We'll build it*"
        body="From first sketch to launch and beyond, we design, build and grow digital products with you."
        image={stock(STOCK.developerWoman, 2000)}
        whatsappHref={whatsappHref}
      />
    </main>
  );
}
