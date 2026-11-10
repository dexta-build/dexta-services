import Image from "next/image";
import { AccentText } from "./accent-text";
import { Button } from "./button";
import { Container } from "./container";
import { Heading } from "./heading";

type ClosingCtaProps = {
  /** Title with *accent* markers. */
  title: string;
  body?: string;
  image: string;
  whatsappHref?: string | null;
  primary?: { label: string; href: string };
  /**
   * "band" = full-bleed photo band (homepage).
   * "card" = rounded photo card inside the page width, copy on the left
   * (Superside's service pages).
   */
  variant?: "band" | "card";
};

/** The photo call-to-action that ends a page. */
export function ClosingCta({
  title,
  body,
  image,
  whatsappHref,
  primary = { label: "Start a project", href: "/contact" },
  variant = "band",
}: ClosingCtaProps) {
  const buttons = (
    <div className="mt-8 flex w-full max-w-[480px] flex-col gap-3 md:w-auto md:flex-row">
      <Button href={primary.href} size="lg" block="mobile" arrow>
        {primary.label}
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
  );

  if (variant === "card") {
    return (
      <section data-surface="canvas" className="bg-surface py-16 md:py-24">
        <Container>
          <div
            data-surface="royal"
            className="bg-surface text-surface-fg relative isolate flex min-h-[460px] items-end overflow-hidden rounded-[10px] p-6 md:min-h-[420px] md:items-center md:p-12 xl:p-16"
          >
            <Image
              src={image}
              alt=""
              fill
              sizes="100vw"
              className="-z-20 object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-gradient-to-t from-[#00042f]/95 via-[#00042f]/60 to-transparent md:bg-gradient-to-r md:from-[#00042f]/90 md:via-[#00042f]/55 md:to-transparent"
            />
            <div className="flex max-w-xl flex-col">
              <Heading size="h1" as="h2">
                <AccentText text={title} />
              </Heading>
              {body && (
                <p className="text-surface-muted mt-4 max-w-md leading-relaxed">
                  {body}
                </p>
              )}
              {buttons}
            </div>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section
      data-surface="royal"
      className="bg-surface text-surface-fg relative isolate flex min-h-[520px] items-center overflow-hidden py-20 md:min-h-[600px] xl:min-h-[680px]"
    >
      <Image
        src={image}
        alt=""
        fill
        sizes="100vw"
        className="-z-20 object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-[#00042f]/95 via-royal/75 to-royal/55"
      />
      <Container className="flex flex-col items-center text-center">
        <Heading size="display" as="h2" className="max-w-4xl">
          <AccentText text={title} />
        </Heading>
        {body && (
          <p className="text-lead text-surface-muted mt-5 max-w-xl">{body}</p>
        )}
        {buttons}
      </Container>
    </section>
  );
}
