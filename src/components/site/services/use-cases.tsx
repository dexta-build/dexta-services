import {
  Building2,
  CalendarDays,
  Church,
  Globe2,
  GraduationCap,
  Heart,
  Megaphone,
  Rocket,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react";
import { AccentText } from "../accent-text";
import { Container } from "../container";
import { Eyebrow } from "../eyebrow";
import { Heading } from "../heading";
import { IconTile } from "../icon-tile";
import { RevealGroup, RevealItem } from "../reveal";
import { Section } from "../section";
import type { UseCaseIcon } from "@/lib/site/services-content";

const ICONS: Record<UseCaseIcon, LucideIcon> = {
  rocket: Rocket,
  store: Store,
  heart: Heart,
  graduation: GraduationCap,
  church: Church,
  building: Building2,
  megaphone: Megaphone,
  calendar: CalendarDays,
  users: Users,
  globe: Globe2,
};

/** Dark band with six icon items (Superside's "Stand out where most brands blend in"). */
export function UseCases({
  eyebrow,
  title,
  body,
  items,
}: {
  eyebrow: string;
  title: string;
  body: string;
  items: { icon: UseCaseIcon; title: string; description: string }[];
}) {
  return (
    <Section surface="royal">
      <Container>
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <Eyebrow>{eyebrow}</Eyebrow>
          <Heading size="h1">
            <AccentText text={title} />
          </Heading>
          <p className="text-surface-muted max-w-xl leading-relaxed">{body}</p>
        </div>
        <RevealGroup className="mt-12 grid gap-10 md:mt-16 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-16">
          {items.map((item) => {
            const Icon = ICONS[item.icon];
            return (
              <RevealItem key={item.title} className="flex flex-col gap-3">
                <IconTile>
                  <Icon />
                </IconTile>
                <h3 className="text-h3 mt-2">{item.title}</h3>
                <p className="text-surface-muted text-[0.9375rem] leading-relaxed">
                  {item.description}
                </p>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </Container>
    </Section>
  );
}
