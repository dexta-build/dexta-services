import type { Metadata } from "next";
import Image from "next/image";
import { Layers, PenTool, Printer, Sparkles } from "lucide-react";
import {
  Accordion,
  Button,
  Container,
  Eyebrow,
  Heading,
  IconTile,
  Marquee,
  Reveal,
  RevealGroup,
  RevealItem,
  Section,
  StatCounter,
  TagChip,
  type Surface,
} from "@/components/site";
import { OffersBand } from "@/components/site/home/offers-band";
import { ViewerDemo } from "./viewer-demo";

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

const brand = [
  { name: "Primary brand", token: "brand", hex: "#000C99" },
  { name: "Secondary brand", token: "brand-cyan", hex: "#00ABFF" },
  { name: "Background", token: "canvas", hex: "#F8F8F5" },
  { name: "Deep Royal", token: "royal", hex: "#00086B" },
  { name: "Ocean Blue", token: "ocean", hex: "#007FC2" },
  { name: "Ice Blue", token: "ice", hex: "#E8F3FF" },
  { name: "White", token: "white", hex: "#FFFFFF" },
  { name: "Charcoal", token: "charcoal", hex: "#202321" },
  { name: "Muted Grey", token: "grey-muted", hex: "#737773" },
];

const accents = [
  {
    name: "Gold",
    use: "Weddings, premium",
    base: "#D4A340",
    deep: "#8A6414",
    soft: "#FBF3DF",
  },
  {
    name: "Lilac",
    use: "Birthdays, celebrations",
    base: "#A996F2",
    deep: "#4B3A9E",
    soft: "#F0ECFF",
  },
  {
    name: "Coral",
    use: "Events, offers, energy",
    base: "#FF7A5C",
    deep: "#A8361B",
    soft: "#FFE9E3",
  },
  {
    name: "Mint",
    use: "Apps & websites, Build",
    base: "#34C9A0",
    deep: "#0F6E55",
    soft: "#E1F7F0",
  },
  {
    name: "Stone",
    use: "Burial & memorial",
    base: "#8C8578",
    deep: "#4A453C",
    soft: "#EFECE6",
  },
];

const surfaces: { surface: Surface; label: string }[] = [
  { surface: "canvas", label: "Canvas" },
  { surface: "white", label: "White" },
  { surface: "ice", label: "Ice" },
  { surface: "royal", label: "Royal" },
  { surface: "brand", label: "Brand" },
  { surface: "ocean", label: "Ocean" },
  { surface: "gold", label: "Gold" },
  { surface: "lilac", label: "Lilac" },
  { surface: "coral", label: "Coral" },
  { surface: "mint", label: "Mint" },
  { surface: "stone", label: "Stone" },
];

const marqueeImages = [
  "/images/school1.jpg",
  "/images/school2.jpg",
  "/images/school3.jpg",
  "/images/school4.jpg",
  "/images/school5.jpg",
  "/images/school6.jpg",
];

function MarqueeCard({ src }: { src: string }) {
  return (
    <div className="relative h-44 w-32 shrink-0 overflow-hidden rounded-[10px] md:h-56 md:w-40">
      <Image src={src} alt="" fill sizes="160px" className="object-cover" />
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <main className="dx-site min-h-screen">
      {/* Intro */}
      <Section surface="royal" spacing="lg">
        <Container>
          <Eyebrow>Phase 0 · Foundations</Eyebrow>
          <Heading size="display" className="mt-5 max-w-4xl">
            The Dexta <em>design system</em>, one place to review it
          </Heading>
          <p className="text-lead text-surface-muted mt-6 max-w-2xl">
            Colours, type, surfaces and the shared components every new public
            page is built from. This page is not linked anywhere and is hidden
            from search engines.
          </p>
          <div className="mt-8 flex flex-col gap-3 md:flex-row">
            <Button size="lg" block="mobile" arrow>
              Start a project
            </Button>
            <Button size="lg" variant="outline" block="mobile">
              See our work
            </Button>
          </div>
        </Container>
      </Section>

      {/* Colours */}
      <Section>
        <Container>
          <Eyebrow rule>Brand colours</Eyebrow>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {brand.map((c) => (
              <div
                key={c.token}
                className="overflow-hidden rounded-[10px] border border-black/5 bg-white"
              >
                <div className="h-24" style={{ background: c.hex }} />
                <div className="p-3 text-sm">
                  <p className="font-bold">{c.name}</p>
                  <p className="text-grey-muted">
                    {c.hex} · <code>{c.token}</code>
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Eyebrow rule className="mt-16">
            Proposed accent colours
          </Eyebrow>
          <p className="text-grey-muted mt-4 max-w-2xl text-sm">
            Each accent has a soft tint for section backgrounds, a base for
            highlights and a deep shade for text on the tint. They sit at the
            same softness as Ice Blue so they read as one family with the blues.
          </p>
          <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {accents.map((a) => (
              <div
                key={a.name}
                className="overflow-hidden rounded-[10px] border border-black/5 bg-white"
              >
                <div className="flex h-24">
                  <div className="flex-1" style={{ background: a.soft }} />
                  <div className="flex-1" style={{ background: a.base }} />
                  <div className="flex-1" style={{ background: a.deep }} />
                </div>
                <div className="p-3 text-sm">
                  <p className="font-bold">{a.name}</p>
                  <p className="text-grey-muted">{a.use}</p>
                  <p className="text-grey-muted mt-1 text-xs">
                    {a.soft} · {a.base} · {a.deep}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Type */}
      <Section surface="white">
        <Container>
          <Eyebrow rule>Typography · Mont + Instrument Serif</Eyebrow>
          <div className="mt-10 flex flex-col gap-10">
            <div>
              <p className="text-grey-muted mb-2 text-xs">
                Display · 40 / 56 / 68 / 84px
              </p>
              <Heading size="display" as="p">
                Your <em>creative</em> partner
              </Heading>
            </div>
            <div>
              <p className="text-grey-muted mb-2 text-xs">
                H1 · 32 / 44 / 52px
              </p>
              <Heading size="h1" as="p">
                See how <em>top brands</em> use Dexta
              </Heading>
            </div>
            <div>
              <p className="text-grey-muted mb-2 text-xs">
                H2 · 26 / 32 / 38px
              </p>
              <Heading size="h2" as="p">
                Design, build and print, <em>all in one place</em>
              </Heading>
            </div>
            <div>
              <p className="text-grey-muted mb-2 text-xs">H3 · 20 / 22px</p>
              <Heading size="h3" as="p">
                Invitation cards that <em>set the tone</em>
              </Heading>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-grey-muted mb-2 text-xs">Lead · 17 / 19px</p>
                <p className="text-lead">
                  We help ambitious brands and the moments that matter look
                  their best, from the first sketch to the final print.
                </p>
              </div>
              <div>
                <p className="text-grey-muted mb-2 text-xs">Body · 16px</p>
                <p>
                  Body copy stays in Mont Regular at a comfortable line height.
                  Bold is used for buttons and labels; Black and Thin are kept
                  for occasional large display moments.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-8">
              <span className="text-5xl font-thin">Thin</span>
              <span className="text-5xl font-normal">Regular</span>
              <span className="text-5xl font-bold">Bold</span>
              <span className="text-5xl font-black">Black</span>
              <span className="text-5xl italic">Italic</span>
              <span className="dx-accent text-5xl">Serif accent</span>
            </div>
          </div>
        </Container>
      </Section>

      {/* Surfaces */}
      {surfaces.map(({ surface, label }) => (
        <Section key={surface} surface={surface} spacing="sm">
          <Container className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <Eyebrow>{label} surface</Eyebrow>
              <Heading size="h1" className="mt-4 max-w-2xl">
                Moments that deserve <em>beautiful design</em>
              </Heading>
              <div className="mt-5 flex flex-wrap gap-2">
                <TagChip>Invitation cards</TagChip>
                <TagChip tone="outline">Brochures</TagChip>
                <TagChip tone="solid">New</TagChip>
              </div>
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
              <Button block="mobile" arrow>
                Primary
              </Button>
              <Button variant="outline" block="mobile">
                Outline
              </Button>
              <Button variant="ghost" arrow>
                Text link
              </Button>
            </div>
          </Container>
        </Section>
      ))}

      {/* Icon tiles + reveal */}
      <Section>
        <Container>
          <Eyebrow rule>Icon tiles · staggered reveal</Eyebrow>
          <RevealGroup className="mt-10 grid gap-10 md:grid-cols-2 xl:grid-cols-4">
            {[
              { icon: PenTool, k: "Design", t: "Brand identities that last" },
              { icon: Layers, k: "Build", t: "Software that scales with you" },
              {
                icon: Printer,
                k: "Print",
                t: "Tangible work, perfectly finished",
              },
              {
                icon: Sparkles,
                k: "Offers",
                t: "Bundles made for your moment",
              },
            ].map(({ icon: Icon, k, t }) => (
              <RevealItem key={k} className="flex flex-col gap-4">
                <IconTile>
                  <Icon />
                </IconTile>
                <p className="text-eyebrow text-surface-muted">{k}</p>
                <p className="text-h3">{t}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      {/* Marquees */}
      <Section surface="royal">
        <Container>
          <Eyebrow>Marquees · hero patterns</Eyebrow>
          <Heading size="h2" className="mt-4">
            Tablet hero: <em>two rows</em>, opposite directions
          </Heading>
        </Container>
        <div className="mt-10 flex flex-col gap-4">
          <Marquee duration={45} gap="1rem">
            {marqueeImages.map((src) => (
              <MarqueeCard key={src} src={src} />
            ))}
          </Marquee>
          <Marquee duration={45} gap="1rem" reverse>
            {[...marqueeImages].reverse().map((src) => (
              <MarqueeCard key={src} src={src} />
            ))}
          </Marquee>
        </div>
        <Container className="mt-16">
          <Heading size="h2">
            Desktop hero: <em>vertical columns</em>
          </Heading>
          <div className="mt-8 grid h-[32rem] grid-cols-3 gap-3 md:w-[30rem]">
            {[false, true, false].map((reverse, col) => (
              <Marquee
                key={col}
                axis="y"
                reverse={reverse}
                duration={38 + col * 6}
                gap="0.75rem"
                fade
                className="h-full"
              >
                {marqueeImages
                  .slice(col)
                  .concat(marqueeImages.slice(0, col))
                  .map((src) => (
                    <MarqueeCard key={src} src={src} />
                  ))}
              </Marquee>
            ))}
          </div>
        </Container>
      </Section>

      {/* Stats */}
      <Section surface="white">
        <Container>
          <Eyebrow rule>Stat counters</Eyebrow>
          <div className="mt-10 grid grid-cols-2 gap-10 xl:grid-cols-4">
            <StatCounter
              value={500}
              suffix="+"
              label="Projects delivered (sample)"
            />
            <StatCounter
              value={120}
              suffix="+"
              label="Brands served (sample)"
            />
            <StatCounter
              value={98}
              suffix="%"
              label="Client satisfaction (sample)"
            />
            <StatCounter value={7} label="Years of craft (sample)" />
          </div>
        </Container>
      </Section>

      {/* Viewer */}
      <Section>
        <Container>
          <Reveal>
            <Eyebrow rule>Media viewer · catalogue preview</Eyebrow>
            <p className="text-grey-muted mt-4 max-w-2xl text-sm">
              Tap any tile. Swipe or use the arrows and keyboard to move between
              items. The side panel shows how price, MOQ and the WhatsApp order
              button will sit on catalogue items.
            </p>
          </Reveal>
          <div className="mt-8">
            <ViewerDemo />
          </div>
        </Container>
      </Section>

      {/* Offers band preview (sample offers with live countdowns) */}
      <OffersBand
        serverNow={Date.now()}
        offers={(
          [
            ["demo-1", "Wedding starter bundle", "Bundle", 2, 150000],
            ["demo-2", "Launch-ready website", "Best value", 6, 180000],
            ["demo-3", "Brand identity kit", "15% off", 12, 95000],
          ] as const
        ).map(([id, name, badge, days, priceNGN]) => ({
          id,
          name,
          description: "Sample offer for previewing the band.",
          features: [],
          priceNGN,
          priceNote: "one-off",
          badge,
          paymentLink: null,
          whatsappEnabled: true,
          startsAt: null,
          endsAt: new Date(Date.now() + days * 86_400_000).toISOString(),
          highlighted: false,
        }))}
      />

      {/* Accordion */}
      <Section surface="ice">
        <Container size="narrow">
          <Eyebrow>FAQs</Eyebrow>
          <Heading size="h1" className="mt-4">
            Frequently asked <em>questions</em>
          </Heading>
          <Accordion
            className="mt-8"
            items={[
              {
                id: "a",
                question: "What is a minimum order quantity (MOQ)?",
                answer:
                  "The smallest number of pieces we can produce for an item, shown on every catalogue item.",
              },
              {
                id: "b",
                question: "Can I pay from outside Nigeria?",
                answer:
                  "Yes. Prices show in NGN, USD, EUR and GBP so you can see what you will pay.",
              },
              {
                id: "c",
                question: "How do I order?",
                answer:
                  "Pick your quantity and tap Order on WhatsApp. Your item and quantity are filled in for you.",
              },
            ]}
          />
        </Container>
      </Section>
    </main>
  );
}
