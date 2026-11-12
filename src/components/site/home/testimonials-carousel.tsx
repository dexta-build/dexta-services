"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/utils";
import { AccentText } from "../accent-text";
import { Container } from "../container";
import { Eyebrow } from "../eyebrow";
import { Heading } from "../heading";
import type { HomeTestimonial } from "@/lib/site/home-data";
import { HOME_TESTIMONIALS } from "@/lib/site/home-content";

/** Repeat items until a row has at least `min` cards. */
function fill<T>(items: T[], min: number): T[] {
  const out = [...items];
  while (out.length < min) out.push(...items);
  return out;
}

/**
 * Two offset rows of quote cards that drift in opposite directions as you
 * scroll past (Superside's "Creative wins" wall). With reduced motion the
 * rows simply scroll sideways by touch or trackpad.
 */
export function TestimonialsCarousel({
  content = HOME_TESTIMONIALS,
  items,
}: {
  content?: typeof HOME_TESTIMONIALS;
  items: HomeTestimonial[];
}) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const xTop = useTransform(scrollYProgress, [0, 1], ["4%", "-22%"]);
  const xBottom = useTransform(scrollYProgress, [0, 1], ["-26%", "0%"]);
  const [brokenLogos, setBrokenLogos] = useState<Set<string>>(new Set());

  if (items.length === 0) return null;

  const rowA = fill(items, 6);
  const rowB = fill([...items].reverse(), 6);

  const card = (t: HomeTestimonial, key: string) => (
    <figure
      key={key}
      className="border-surface-rule bg-surface-card flex w-[19rem] shrink-0 flex-col gap-5 rounded-[10px] border p-5 md:w-[22rem] md:p-6 xl:w-[24rem]"
    >
      <figcaption className="flex items-center gap-3">
        {t.logo && !brokenLogos.has(t.id) ? (
          <Image
            src={t.logo}
            alt=""
            width={40}
            height={40}
            unoptimized
            onError={() => setBrokenLogos((prev) => new Set(prev).add(t.id))}
            className="size-10 rounded-full object-contain"
          />
        ) : (
          <span
            aria-hidden
            className="bg-ice text-royal flex size-10 items-center justify-center rounded-full text-sm font-bold"
          >
            {t.author.charAt(0)}
          </span>
        )}
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-bold">{t.author}</span>
          <span className="text-surface-muted truncate text-xs">{t.role}</span>
        </span>
      </figcaption>
      <blockquote className="flex-1 text-[0.9375rem] leading-relaxed">
        “{t.quote}”
      </blockquote>
      <p className="text-xs font-black tracking-[0.12em] uppercase">
        {t.company}
      </p>
    </figure>
  );

  const rowClass = cn(
    "flex gap-4 px-4",
    reduce && "dx-no-scrollbar overflow-x-auto",
  );

  return (
    <section
      ref={ref}
      data-surface="canvas"
      className="bg-surface text-surface-fg relative overflow-hidden py-16 md:py-24 xl:py-32"
    >
      <Container>
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <Heading size="h1">
            <AccentText text={content.title} />
          </Heading>
        </div>
      </Container>

      <div className="mt-10 flex flex-col gap-4 md:mt-14">
        <motion.div
          className={rowClass}
          style={reduce ? undefined : { x: xTop }}
        >
          {rowA.map((t, i) => card(t, `a-${t.id}-${i}`))}
        </motion.div>
        <motion.div
          className={cn(rowClass, "md:pl-40")}
          style={reduce ? undefined : { x: xBottom }}
        >
          {rowB.map((t, i) => card(t, `b-${t.id}-${i}`))}
        </motion.div>
      </div>
    </section>
  );
}
