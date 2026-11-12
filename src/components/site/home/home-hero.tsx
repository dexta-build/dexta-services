import { AccentText } from "../accent-text";
import { Button } from "../button";
import { Heading } from "../heading";
import { Section } from "../section";
import { HeroGallery } from "./hero-gallery";
import type {
  HeroProject,
  HomeHero as HomeHeroData,
} from "@/lib/site/home-data";

/**
 * Homepage hero in three layouts, as on Superside:
 * - Mobile (<768): centred copy, full-width buttons, two sliding rows.
 * - Tablet (768–1279): centred copy, buttons inline, two sliding rows.
 * - Desktop (1280+): copy on the left, three drifting columns on the right
 *   that you can scroll with the mouse wheel.
 * Every tile is a project; clicking it opens the project gallery.
 */
export function HomeHero({
  hero,
  projects,
  whatsappHref,
}: {
  hero: HomeHeroData;
  projects: HeroProject[];
  /** "Start a project" opens WhatsApp (falls back to the contact page). */
  whatsappHref: string | null;
}) {
  return (
    <Section surface="royal" spacing="none" className="overflow-hidden">
      <HeroGallery
        projects={projects}
        copy={
          <div
            key="hero-copy"
            className="mx-auto flex max-w-[640px] flex-col items-center pt-10 text-center md:pt-16 xl:mx-0 xl:max-w-none xl:items-start xl:justify-center xl:py-24 xl:text-left"
          >
            <Heading
              size="display"
              className="md:max-w-[600px] xl:max-w-[640px]"
            >
              <AccentText text={hero.headline} />
            </Heading>
            <p className="text-lead text-surface-muted mt-4 max-w-[532px] xl:mt-6">
              {hero.body}
            </p>
            <div className="mt-6 flex w-full max-w-[480px] flex-col gap-3 md:w-auto md:flex-row md:justify-center xl:mt-10 xl:justify-start">
              <Button
                href={whatsappHref ?? "/contact"}
                external={Boolean(whatsappHref)}
                size="lg"
                block="mobile"
                arrow
              >
                {hero.primaryLabel || "Start a project"}
              </Button>
              <Button
                href={hero.ctaHref}
                size="lg"
                variant="outline"
                block="mobile"
              >
                {hero.ctaText}
              </Button>
            </div>
          </div>
        }
      />
    </Section>
  );
}
