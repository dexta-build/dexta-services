import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AccentText } from "../accent-text";
import { Button } from "../button";
import { Container } from "../container";
import { Eyebrow } from "../eyebrow";
import { Heading } from "../heading";
import { Marquee } from "../marquee";
import { stock } from "@/lib/site/stock-media";

type Crumb = { label: string; href: string };

type ServiceHeroProps = {
  eyebrow: string;
  title: string;
  body: string;
  image: string;
  chips?: { label: string; image: string }[];
  breadcrumbs?: Crumb[];
  whatsappHref?: string | null;
};

/**
 * Superside's service hero: full-bleed photo with the copy over a dark
 * gradient, and a sliding row of offering chips along the bottom.
 */
export function ServiceHero({
  eyebrow,
  title,
  body,
  image,
  chips = [],
  breadcrumbs = [],
  whatsappHref,
}: ServiceHeroProps) {
  return (
    <section
      data-surface="royal"
      className="bg-surface text-surface-fg relative isolate flex min-h-[640px] flex-col overflow-hidden md:min-h-[600px] xl:min-h-[680px]"
    >
      <Image
        src={stock(image, 2000)}
        alt=""
        fill
        priority
        fetchPriority="high"
        sizes="100vw"
        className="-z-20 object-cover"
      />
      {/* Dark at the bottom on phones, dark on the left on desktop */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-[#00042f] via-[#00042f]/80 to-[#00042f]/30 md:bg-gradient-to-r md:from-[#00042f]/95 md:via-[#00042f]/70 md:to-[#00042f]/10"
      />

      <Container className="flex flex-1 flex-col justify-end pt-40 pb-8 md:justify-center md:pt-20 md:pb-10">
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="text-surface-muted flex flex-wrap items-center gap-1 text-sm">
              {breadcrumbs.map((c, i) => (
                <li key={c.href} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight aria-hidden className="size-3.5" />}
                  <Link href={c.href} className="dx-link hover:text-surface-fg">
                    {c.label}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        )}
        <div className="flex max-w-2xl flex-col gap-5">
          <Eyebrow>{eyebrow}</Eyebrow>
          <Heading size="display" as="h1">
            <AccentText text={title} />
          </Heading>
          <p className="text-lead text-surface-muted max-w-xl">{body}</p>
          <div className="mt-2 flex flex-col gap-3 md:flex-row">
            <Button href="/contact" size="lg" block="mobile" arrow>
              Start a project
            </Button>
            {whatsappHref && (
              <Button
                href={whatsappHref}
                external
                variant="outline"
                size="lg"
                block="mobile"
              >
                Chat on WhatsApp
              </Button>
            )}
          </div>
        </div>
      </Container>

      {chips.length > 0 && (
        <Marquee
          duration={Math.max(30, chips.length * 7)}
          gap="0.75rem"
          pauseOnHover
          className="pb-6 md:pb-8"
        >
          {chips.map((chip) => (
            <span
              key={chip.label}
              className="text-charcoal flex shrink-0 items-center gap-3 rounded-[10px] bg-white py-1.5 pr-4 pl-1.5 text-sm shadow-sm"
            >
              <span className="relative h-9 w-12 overflow-hidden rounded-md">
                <Image
                  src={stock(chip.image, 120, 90)}
                  alt=""
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </span>
              {chip.label}
            </span>
          ))}
        </Marquee>
      )}
    </section>
  );
}
