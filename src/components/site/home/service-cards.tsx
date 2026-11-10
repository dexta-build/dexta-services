import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccentText } from "../accent-text";
import { Container } from "../container";
import { Eyebrow } from "../eyebrow";
import { Heading } from "../heading";
import { Reveal } from "../reveal";
import { Section } from "../section";
import type { HomeService } from "@/lib/site/home-data";
import { HOME_SERVICES } from "@/lib/site/home-content";
import { SERVICE_GROUPS } from "@/lib/site/navigation";
import { stock } from "@/lib/site/stock-media";

/**
 * Superside's "Easy & hassle-free" cards: tall photo cards with a coloured
 * panel. On desktop hover the card lifts and the panel grows to reveal the
 * description. On touch screens the description is always shown; tablets
 * get a swipeable row.
 */
export function ServiceCards({ services }: { services: HomeService[] }) {
  return (
    <Section surface="royal">
      <Container>
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <Eyebrow>{HOME_SERVICES.eyebrow}</Eyebrow>
          <Heading size="h1">
            <AccentText text={HOME_SERVICES.title} />
          </Heading>
        </div>
      </Container>

      <Reveal>
        <div className="dx-no-scrollbar mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 md:mt-14 md:px-8 lg:mx-auto lg:grid lg:max-w-[82rem] lg:grid-cols-3 lg:overflow-visible lg:px-12 3xl:max-w-[94rem]">
          {services.map((service, i) => {
            const group = SERVICE_GROUPS.find(
              (g) => g.key === service.type.toLowerCase(),
            );
            return (
              <Link
                key={service.type}
                href={group?.href ?? "/services"}
                className="group relative flex h-[30rem] w-[82%] shrink-0 snap-start flex-col overflow-hidden rounded-[10px] transition-transform duration-500 ease-(--ease-out-expo) md:h-[34rem] md:w-[46%] lg:h-[36rem] lg:w-auto lg:hover:-translate-y-2.5 lg:focus-visible:-translate-y-2.5 xl:h-[42rem]"
              >
                <div className="relative min-h-0 flex-1 overflow-hidden">
                  <Image
                    src={stock(HOME_SERVICES.images[service.type], 900, 1100)}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 46vw, 82vw"
                    className="object-cover transition-transform duration-700 ease-(--ease-out-expo) group-hover:scale-105"
                  />
                </div>
                <div
                  className={cn(
                    "flex flex-col p-6 md:p-7 [&_em]:text-current",
                    HOME_SERVICES.panels[i],
                  )}
                >
                  <h3 className="dx-heading text-h2">
                    <AccentText text={HOME_SERVICES.headlines[service.type]} />
                  </h3>
                  {/* Always open below 1024px; opens on hover/focus above */}
                  <div className="grid grid-rows-[1fr] transition-[grid-template-rows] duration-500 ease-(--ease-out-expo) lg:grid-rows-[0fr] lg:group-hover:grid-rows-[1fr] lg:group-focus-visible:grid-rows-[1fr]">
                    <div className="overflow-hidden">
                      <p className="pt-3 text-sm leading-relaxed opacity-85">
                        {service.description ||
                          HOME_SERVICES.fallbackDescriptions[service.type]}
                      </p>
                      <span className="inline-flex items-center gap-1.5 pt-4 text-sm font-bold">
                        Explore {group?.title ?? "service"}
                        <ArrowUpRight
                          aria-hidden
                          className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
          <span aria-hidden className="w-px shrink-0 lg:hidden" />
        </div>
      </Reveal>
    </Section>
  );
}
