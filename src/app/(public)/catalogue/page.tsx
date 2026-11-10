import type { Metadata } from "next";
import { MessageCircle, MousePointerClick, PackageCheck } from "lucide-react";
import { AccentText } from "@/components/site/accent-text";
import { CatalogueCards } from "@/components/site/catalogue/catalogue-cards";
import {
  CurrencyProvider,
  CurrencySwitcher,
} from "@/components/site/catalogue/currency";
import { ClosingCta } from "@/components/site/closing-cta";
import { Container } from "@/components/site/container";
import { Eyebrow } from "@/components/site/eyebrow";
import { Heading } from "@/components/site/heading";
import { IconTile } from "@/components/site/icon-tile";
import { RevealGroup, RevealItem } from "@/components/site/reveal";
import { Section } from "@/components/site/section";
import { FaqSection } from "@/components/site/services/faq-section";
import { getCatalogues } from "@/lib/site/catalogue-data";
import { getWhatsAppHref } from "@/lib/site/page-context";
import { getRates } from "@/lib/site/rates";
import { STOCK, stock } from "@/lib/site/stock-media";

export const metadata: Metadata = {
  alternates: { canonical: "/catalogue" },
  title: "Catalogues",
  description:
    "Ready-made designs for weddings, events, birthdays, burials, businesses and websites. Pick a design, choose your quantity and order on WhatsApp.",
};

const STEPS = [
  {
    icon: MousePointerClick,
    title: "Pick a design",
    body: "Browse a catalogue and open any design to see it up close, with its price and minimum order.",
  },
  {
    icon: PackageCheck,
    title: "Choose your quantity",
    body: "Set how many you need. We show the total in naira, dollars, euros or pounds.",
  },
  {
    icon: MessageCircle,
    title: "Order on WhatsApp",
    body: "Tap order and your item, quantity and total are filled in for you. We'll confirm and get started.",
  },
];

const FAQS = [
  {
    q: "What is a minimum order quantity (MOQ)?",
    a: "It's the smallest number we can produce for an item. Every design shows its MOQ, and the quantity picker starts there.",
  },
  {
    q: "Can I pay from outside Nigeria?",
    a: "Yes. Prices are shown in naira, US dollars, euros and pounds, using live exchange rates. We confirm the final amount before production.",
  },
  {
    q: "Can you change a design for me?",
    a: "Of course. Names, dates, colours and wording are included. Bigger changes can be quoted on WhatsApp.",
  },
  {
    q: "How long does delivery take?",
    a: "Most printed items are ready in 3–7 working days after you approve the proof. We deliver across Nigeria and can ship abroad.",
  },
];

export default async function CataloguesPage() {
  const [rates, whatsappHref] = await Promise.all([
    getRates(),
    getWhatsAppHref("Hello Dexta, I'd like to order from your catalogues."),
  ]);
  const catalogues = getCatalogues();

  return (
    <CurrencyProvider rates={rates}>
      <main className="dx-site">
        <Section spacing="sm" className="pt-12 md:pt-16">
          <Container className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="flex max-w-3xl flex-col gap-5">
              <Eyebrow>Catalogues</Eyebrow>
              <Heading size="display" as="h1">
                <AccentText text="Ready-made designs for *every occasion*" />
              </Heading>
              <p className="text-lead text-surface-muted max-w-xl">
                Choose a catalogue, pick the design you love and order on
                WhatsApp in the quantity you need.
              </p>
            </div>
            <div className="flex flex-col gap-2 md:items-end">
              <span className="text-surface-muted text-sm">Show prices in</span>
              <CurrencySwitcher />
            </div>
          </Container>
          <Container className="mt-10 md:mt-14">
            <CatalogueCards catalogues={catalogues} />
          </Container>
        </Section>

        <Section surface="royal">
          <Container>
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
              <Eyebrow>How ordering works</Eyebrow>
              <Heading size="h1">
                <AccentText text="Three steps to *your order*" />
              </Heading>
            </div>
            <RevealGroup className="mt-12 grid gap-10 md:mt-16 md:grid-cols-3">
              {STEPS.map(({ icon: Icon, title, body }, i) => (
                <RevealItem key={title} className="flex flex-col gap-4">
                  <IconTile>
                    <Icon />
                  </IconTile>
                  <p className="text-eyebrow text-surface-muted">
                    Step {i + 1}
                  </p>
                  <h3 className="text-h3">{title}</h3>
                  <p className="text-surface-muted leading-relaxed">{body}</p>
                </RevealItem>
              ))}
            </RevealGroup>
          </Container>
        </Section>

        <FaqSection title="Questions about *ordering*" faqs={FAQS} />

        <ClosingCta
          title="Can't find what you need? *We'll design it*"
          body="Tell us about your occasion and we'll create something just for you."
          image={stock(STOCK.weddingTable, 2000)}
          whatsappHref={whatsappHref}
        />
      </main>
    </CurrencyProvider>
  );
}
