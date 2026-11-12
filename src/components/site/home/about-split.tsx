import Image from "next/image";
import { AccentText } from "../accent-text";
import { Button } from "../button";
import { Container } from "../container";
import { Eyebrow } from "../eyebrow";
import { Heading } from "../heading";
import { Reveal } from "../reveal";
import { Section } from "../section";
import { ShowreelTeaser } from "./showreel-teaser";
import { HOME_ABOUT, HOME_ADVANTAGE } from "@/lib/site/home-content";
import { SHOWREEL_VIDEO, stock } from "@/lib/site/stock-media";

/**
 * Two stacked splits, as on Superside:
 * 1. "Who we are": copy left, photo right.
 * 2. "Your creative advantage": looping showreel teaser left, copy right.
 * On mobile and tablet the media sits above the copy.
 */
export function AboutSplit({
  about = HOME_ABOUT,
  advantage = HOME_ADVANTAGE,
  hideAbout = false,
  hideAdvantage = false,
}: {
  hideAbout?: boolean;
  hideAdvantage?: boolean;
  about?: typeof HOME_ABOUT & { imageAlt?: string };
  advantage?: Omit<typeof HOME_ADVANTAGE, "teaserImages"> & {
    teaserImages: string[];
    video?: string;
  };
} = {}) {
  return (
    <Section spacing="md">
      <Container className="flex flex-col gap-20 md:gap-28 xl:gap-36">
        {!hideAbout && (
          <>
            {/* Who we are */}
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12 xl:gap-20">
              <Reveal className="lg:order-last">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[10px] lg:aspect-square">
                  <Image
                    src={stock(about.image, 1400)}
                    alt={about.imageAlt ?? "The Dexta team at work"}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </Reveal>
              <Reveal className="flex flex-col gap-6">
                <Eyebrow rule>{about.eyebrow}</Eyebrow>
                <Heading size="h1">
                  <AccentText text={about.title} />
                </Heading>
                <p className="text-lead">{about.lead}</p>
                <p className="text-surface-muted leading-relaxed">
                  {about.body}
                </p>
                <div>
                  <Button href={about.cta.href} size="lg" block="mobile" arrow>
                    {about.cta.label}
                  </Button>
                </div>
              </Reveal>
            </div>
          </>
        )}
        {!hideAdvantage && (
          <>
            {/* Your creative advantage */}
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12 xl:gap-20">
              <Reveal>
                <ShowreelTeaser
                  words={advantage.teaserWords}
                  images={advantage.teaserImages.map((id) =>
                    stock(id, 700, 700),
                  )}
                  video={advantage.video ?? SHOWREEL_VIDEO}
                />
              </Reveal>
              <Reveal className="flex flex-col gap-6">
                <Eyebrow rule>{advantage.eyebrow}</Eyebrow>
                <Heading size="h1">
                  <AccentText text={advantage.title} />
                </Heading>
                <p className="text-lead">{advantage.lead}</p>
                <p className="text-surface-muted leading-relaxed">
                  {advantage.body}
                </p>
                <div>
                  <Button
                    href={advantage.cta.href}
                    size="lg"
                    block="mobile"
                    arrow
                  >
                    {advantage.cta.label}
                  </Button>
                </div>
              </Reveal>
            </div>
          </>
        )}
      </Container>
    </Section>
  );
}
