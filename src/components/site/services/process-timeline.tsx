"use client";

import { useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from "motion/react";
import { cn } from "@/lib/utils";
import { AccentText } from "../accent-text";
import { Container } from "../container";
import { Eyebrow } from "../eyebrow";
import { Heading } from "../heading";

/**
 * Superside's "How we work": the heading stays pinned on the left (desktop)
 * while numbered steps scroll past on the right. A line fills as you scroll
 * and each step's circle lights up when you reach it.
 */
export function ProcessTimeline({
  eyebrow,
  title,
  body,
  steps,
}: {
  eyebrow: string;
  title: string;
  body: string;
  steps: { title: string; description: string }[];
}) {
  const listRef = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ["start 65%", "end 55%"],
  });
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const [reached, setReached] = useState(reduce ? steps.length : 0);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (reduce) return;
    // Step i sits at i/(n-1) along the line; light it once the fill passes.
    const n = steps.length;
    setReached(
      v <= 0.001 ? 0 : Math.min(n, Math.floor(v * (n - 1) + 0.05) + 1),
    );
  });

  return (
    <section
      data-surface="royal"
      className="bg-surface text-surface-fg py-16 md:py-24 xl:py-32"
    >
      <Container className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <div className="flex flex-col gap-5">
            <Eyebrow>{eyebrow}</Eyebrow>
            <Heading size="h1">
              <AccentText text={title} />
            </Heading>
            <p className="text-surface-muted max-w-md leading-relaxed">
              {body}
            </p>
          </div>
        </div>

        <ol
          ref={listRef}
          className="relative flex flex-col gap-10 md:gap-14 lg:gap-24 lg:py-8"
        >
          {/* Track and fill line behind the circles */}
          <span
            aria-hidden
            className="bg-surface-fg/15 absolute top-5 bottom-5 left-5 w-px"
          />
          <motion.span
            aria-hidden
            className="bg-brand-cyan absolute top-5 bottom-5 left-5 w-px origin-top"
            style={{ scaleY: reduce ? 1 : fill }}
          />
          {steps.map((step, i) => {
            const on = i < reached;
            return (
              <li key={step.title} className="relative flex gap-6">
                <span
                  className={cn(
                    "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border font-[family-name:var(--font-accent)] text-lg transition-colors duration-500",
                    on
                      ? "border-brand-cyan bg-brand-cyan text-royal"
                      : "border-surface-fg/40 bg-surface text-surface-fg",
                  )}
                >
                  {i + 1}
                </span>
                <div className="flex flex-col gap-2 pt-1.5">
                  <h3 className="text-h3">{step.title}</h3>
                  <p className="text-surface-muted max-w-md leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </Container>
    </section>
  );
}
