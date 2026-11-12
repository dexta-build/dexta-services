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
import { getCatalogues } from "@/lib/site/catalogue-store";
import { CATALOGUES_PAGE } from "@/lib/content/pages/main";
import { pageMetadata } from "@/lib/content/seo";
import { getWhatsApp } from "@/lib/content/site-settings";
import { loadPage } from "@/lib/content/store";
import { getRates } from "@/lib/site/rates";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(CATALOGUES_PAGE);
}

const STEP_ICONS = [MousePointerClick, PackageCheck, MessageCircle];

export default async function CataloguesPage() {
  const [rates, whatsappHref, catalogues] = await Promise.all([
    getRates(),
    getWhatsApp("catalogues"),
    getCatalogues(),
  ]);
  const { data: c, hidden } = await loadPage(CATALOGUES_PAGE);

  return (
    <CurrencyProvider rates={rates}>
      <main className="dx-site">
        <Section spacing="sm" className="pt-12 md:pt-16">
          <Container className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="flex max-w-3xl flex-col gap-5">
              {c.hero.eyebrow && <Eyebrow>{c.hero.eyebrow}</Eyebrow>}
              <Heading size="display" as="h1">
                <AccentText text={c.hero.title} />
              </Heading>
              <p className="text-lead text-surface-muted max-w-xl">
                {c.hero.body}
              </p>
            </div>
            <div className="flex flex-col gap-2 md:items-end">
              <span className="text-surface-muted text-sm">
                {c.hero.currencyLabel}
              </span>
              <CurrencySwitcher />
            </div>
          </Container>
          <Container className="mt-10 md:mt-14">
            <CatalogueCards catalogues={catalogues} />
          </Container>
        </Section>

        {!hidden.steps && (
          <Section surface="royal">
            <Container>
              <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
                {c.steps.eyebrow && <Eyebrow>{c.steps.eyebrow}</Eyebrow>}
                <Heading size="h1">
                  <AccentText text={c.steps.title} />
                </Heading>
              </div>
              <RevealGroup className="mt-12 grid gap-10 md:mt-16 md:grid-cols-3">
                {c.steps.items.map(({ title, body }, i) => {
                  const Icon = STEP_ICONS[i % STEP_ICONS.length];
                  return (
                    <RevealItem
                      key={`${title}-${i}`}
                      className="flex flex-col gap-4"
                    >
                      <IconTile>
                        <Icon />
                      </IconTile>
                      <p className="text-eyebrow text-surface-muted">
                        {(c.steps.stepLabel || "Step {n}").replace(
                          "{n}",
                          String(i + 1),
                        )}
                      </p>
                      <h3 className="text-h3">{title}</h3>
                      <p className="text-surface-muted leading-relaxed">
                        {body}
                      </p>
                    </RevealItem>
                  );
                })}
              </RevealGroup>
            </Container>
          </Section>
        )}

        {!hidden.faq && <FaqSection title={c.faq.title} faqs={c.faq.items} />}

        {!hidden.closing && (
          <ClosingCta content={c.closing} whatsappHref={whatsappHref} />
        )}
      </main>
    </CurrencyProvider>
  );
}
