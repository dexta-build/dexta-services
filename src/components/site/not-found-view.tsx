import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Briefcase,
  LayoutGrid,
  MessageCircle,
  Sparkles,
  Tag,
} from "lucide-react";
import { getWhatsApp } from "@/lib/content/site-settings";
import { Button } from "./button";
import { Container } from "./container";

const DESTINATIONS = [
  {
    href: "/services",
    label: "Services",
    text: "Design, build and print, under one roof.",
    icon: LayoutGrid,
  },
  {
    href: "/works",
    label: "Works",
    text: "Projects we've made for brands like yours.",
    icon: Briefcase,
  },
  {
    href: "/offers",
    label: "Offers",
    text: "Packages and deals running right now.",
    icon: Tag,
  },
  {
    href: "/catalogue",
    label: "Catalogues",
    text: "Designs you can order on WhatsApp.",
    icon: Sparkles,
  },
  {
    href: "/thoughts",
    label: "Thoughts",
    text: "Ideas and lessons from the studio.",
    icon: BookOpen,
  },
  {
    href: "/contact",
    label: "Contact",
    text: "Tell us what you're working on.",
    icon: MessageCircle,
  },
] as const;

/**
 * The 404 page: says plainly that the page isn't here, and offers the
 * likeliest next steps.
 */
export async function NotFoundView() {
  const whatsappHref = await getWhatsApp("general").catch(() => null);

  return (
    <main className="dx-site">
      <section data-surface="canvas" className="bg-surface text-surface-fg">
        <Container className="pt-32 pb-16 md:pt-40 md:pb-24">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
            <p
              aria-hidden
              className="dx-heading text-royal text-[clamp(7rem,24vw,17rem)] leading-[0.8] font-normal tracking-[-0.06em] select-none"
            >
              4<em className="text-brand-cyan">0</em>4
            </p>
            <div className="flex flex-col items-start gap-5 lg:pb-4">
              <p className="text-eyebrow text-surface-fg/80">Page not found</p>
              <h1 className="dx-heading text-h1 font-normal text-balance">
                This page has <em>moved on</em>
              </h1>
              <p className="text-surface-muted max-w-md text-lg leading-relaxed">
                The link may be old, or the address has a typo. Everything else
                is right where you left it.
              </p>
              <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Button href="/" size="lg" arrow block="mobile">
                  Back to home
                </Button>
                {whatsappHref ? (
                  <Button
                    href={whatsappHref}
                    external
                    size="lg"
                    variant="outline"
                    block="mobile"
                  >
                    Ask us on WhatsApp
                  </Button>
                ) : (
                  <Button
                    href="/contact"
                    size="lg"
                    variant="outline"
                    block="mobile"
                  >
                    Contact us
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section data-surface="white" className="bg-surface text-surface-fg">
        <Container className="py-16 md:py-20">
          <h2 className="text-eyebrow text-surface-fg/80 mb-6">
            Or pick up from here
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {DESTINATIONS.map(({ href, label, text, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="group bg-canvas hover:bg-ice flex h-full items-start gap-4 rounded-[10px] p-5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-cyan)]"
                >
                  <span className="text-royal inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-white">
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex items-center gap-1 font-bold">
                      {label}
                      <ArrowUpRight
                        aria-hidden
                        className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </span>
                    <span className="text-surface-muted text-sm leading-relaxed">
                      {text}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </main>
  );
}
