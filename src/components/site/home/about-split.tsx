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
export function AboutSplit() {
  return (
    <Section spacing="md">
      <Container className="flex flex-col gap-20 md:gap-28 xl:gap-36">
        {/* Who we are */}
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12 xl:gap-20">
          <Reveal className="lg:order-last">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[10px] lg:aspect-square">
              <Image
                src={HOME_ABOUT.image}
                alt="The Dexta team at work"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </Reveal>
          <Reveal className="flex flex-col gap-6">
            <Eyebrow rule>{HOME_ABOUT.eyebrow}</Eyebrow>
            <Heading size="h1">
              <AccentText text={HOME_ABOUT.title} />
            </Heading>
            <p className="text-lead">{HOME_ABOUT.lead}</p>
            <p className="text-surface-muted leading-relaxed">
              {HOME_ABOUT.body}
            </p>
            <div>
              <Button href={HOME_ABOUT.cta.href} size="lg" block="mobile" arrow>
                {HOME_ABOUT.cta.label}
              </Button>
            </div>
          </Reveal>
        </div>

        {/* Your creative advantage */}
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12 xl:gap-20">
          <Reveal>
            <ShowreelTeaser
              words={HOME_ADVANTAGE.teaserWords}
              images={HOME_ADVANTAGE.teaserImages.map((id) =>
                stock(id, 700, 700),
              )}
              video={SHOWREEL_VIDEO}
            />
          </Reveal>
          <Reveal className="flex flex-col gap-6">
            <Eyebrow rule>{HOME_ADVANTAGE.eyebrow}</Eyebrow>
            <Heading size="h1">
              <AccentText text={HOME_ADVANTAGE.title} />
            </Heading>
            <p className="text-lead">{HOME_ADVANTAGE.lead}</p>
            <p className="text-surface-muted leading-relaxed">
              {HOME_ADVANTAGE.body}
            </p>
            <div>
              <Button
                href={HOME_ADVANTAGE.cta.href}
                size="lg"
                block="mobile"
                arrow
              >
                {HOME_ADVANTAGE.cta.label}
              </Button>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
