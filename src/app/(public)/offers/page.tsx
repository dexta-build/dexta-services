import type { Metadata } from "next";
import Image from "next/image";
import { Check } from "lucide-react";
import { AccentText } from "@/components/site/accent-text";
import { Button } from "@/components/site/button";
import {
  CurrencyProvider,
  CurrencySwitcher,
} from "@/components/site/catalogue/currency";
import { ClosingCta } from "@/components/site/closing-cta";
import { Container } from "@/components/site/container";
import { Eyebrow } from "@/components/site/eyebrow";
import { Heading } from "@/components/site/heading";
import { LogoStrip } from "@/components/site/home/logo-strip";
import { StatsBand } from "@/components/site/home/stats-band";
import { NoOffers, OffersGrid } from "@/components/site/offers/offers-grid";
import { RevealGroup, RevealItem } from "@/components/site/reveal";
import { Section } from "@/components/site/section";
import { FaqSection } from "@/components/site/services/faq-section";
import { getHomeData } from "@/lib/site/home-data";
import { OFFERS_PAGE } from "@/lib/site/offers-content";
import { getOffers, notEnded } from "@/lib/site/offers-data";
import { getWhatsAppHref } from "@/lib/site/page-context";
import { getRates } from "@/lib/site/rates";
import { stock } from "@/lib/site/stock-media";

export const metadata: Metadata = {
  alternates: { canonical: "/offers" },
  title: "Offers",
  description:
    "Ready-made offers from Dexta across design, software and print, at a clear price. Pay online or order on WhatsApp.",
};

type Search = Record<string, string | string[] | undefined>;

export default async function OffersPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const [search, offers, rates, home, whatsappBase, ctaWhatsapp] =
    await Promise.all([
      searchParams,
      getOffers(),
      getRates(),
      getHomeData(),
      getWhatsAppHref(),
      getWhatsAppHref("Hello Dexta, I'd like to ask about your offers."),
    ]);
  const { hero, offers: intro, includes, faqs, closing } = OFFERS_PAGE;
  const serverNow = Date.now();
  // Development only: /offers?preview=empty shows the empty state.
  const previewEmpty =
    process.env.NODE_ENV !== "production" && search.preview === "empty";

  return (
    <CurrencyProvider rates={rates}>
      <main className="dx-site">
        {/* Hero: photo with the headline over it, like Superside's pricing */}
        <section
          data-surface="royal"
          className="bg-surface text-surface-fg relative isolate flex min-h-[34rem] items-end overflow-hidden md:min-h-[38rem] lg:min-h-[40rem]"
        >
          <Image
            src={stock(hero.image, 2400)}
            alt=""
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            className="-z-20 object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-gradient-to-t from-[#00042f]/90 via-[#00042f]/55 to-[#00042f]/10 md:bg-gradient-to-r md:from-[#00042f]/85 md:via-[#00042f]/45 md:to-transparent"
          />
          <Container className="pt-32 pb-12 md:pb-16 lg:pb-20">
            <div className="flex max-w-2xl flex-col items-start gap-5">
              <Eyebrow>{hero.eyebrow}</Eyebrow>
              <Heading size="display" as="h1">
                <AccentText text={hero.title} />
              </Heading>
              <p className="text-lead text-surface-fg/85 max-w-xl">
                {hero.body}
              </p>
              <Button href="#offers" size="lg" arrow className="mt-2">
                {hero.cta}
              </Button>
            </div>
          </Container>
        </section>

        <LogoStrip brands={home.brands} />

        {/* Offers */}
        <Section id="offers" className="scroll-mt-24">
          <Container>
            <div className="mb-10 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between">
              <div className="flex max-w-2xl flex-col gap-4">
                <Eyebrow>{intro.eyebrow}</Eyebrow>
                <Heading size="h1">
                  <AccentText text={intro.title} />
                </Heading>
                <p className="text-surface-muted text-lg leading-relaxed">
                  {intro.body}
                </p>
              </div>
              <div className="flex flex-col gap-2 md:items-end">
                <span className="text-surface-muted text-sm">
                  Show prices in
                </span>
                <CurrencySwitcher />
              </div>
            </div>

            {previewEmpty ? (
              <NoOffers whatsappBase={whatsappBase} />
            ) : (
              <OffersGrid
                offers={notEnded(offers, serverNow)}
                serverNow={serverNow}
                whatsappBase={whatsappBase}
              />
            )}

            {/* Every offer includes */}
            <div className="mx-auto mt-20 max-w-5xl md:mt-28">
              <h2 className="text-h3 mb-8 text-center md:mb-10">
                {includes.title}
              </h2>
              <RevealGroup className="grid md:grid-cols-2 md:gap-x-12">
                {includes.items.map((item) => (
                  <RevealItem
                    key={item}
                    className="border-surface-rule flex items-center justify-between gap-4 border-b py-4 text-sm md:text-base"
                  >
                    {item}
                    <Check aria-hidden className="size-4 shrink-0" />
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>
          </Container>
        </Section>

        <StatsBand />

        <FaqSection title="Questions about *offers*" faqs={faqs} />

        <ClosingCta
          title={closing.title}
          body={closing.body}
          image={stock(closing.image, 2000)}
          whatsappHref={ctaWhatsapp}
        />
      </main>
    </CurrencyProvider>
  );
}
