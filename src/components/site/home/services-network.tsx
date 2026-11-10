"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { AccentText } from "../accent-text";
import { Container } from "../container";
import { Eyebrow } from "../eyebrow";
import { Heading } from "../heading";
import { HOME_NETWORK } from "@/lib/site/home-content";
import { stock } from "@/lib/site/stock-media";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Chip colours: brand blues mixed with the accent family. */
const CHIP_STYLES = [
  "bg-brand-cyan text-royal",
  "bg-ice text-royal",
  "bg-royal text-ice",
  "bg-gold-soft text-gold-deep",
  "bg-ocean-deep text-white",
  "bg-lilac-soft text-lilac-deep",
  "bg-mint-soft text-mint-deep",
  "bg-coral-soft text-coral-deep",
];

/**
 * Looping sequence, like Superside's services video:
 * intro (logo large) → chips arrive → lines draw and avatars pop in →
 * hold (avatars pulse in turn, dashes flow along the lines) → out → repeat.
 */
type Phase = "intro" | "chips" | "fan" | "hold" | "out";

const HOLD_MS = 6000;
const PULSE_MS = 900;

/**
 * Superside's services graphic, built live and looping while on screen:
 * a cloud of service chips flows into the Dexta tile, which fans out to the
 * people we serve. It pauses off screen and restarts when you come back.
 * Horizontal from 1024px; stacked vertically below.
 */
export function ServicesNetwork() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const reduce = useReducedMotion();
  const { chips, audiences } = HOME_NETWORK;
  const [phase, setPhase] = useState<Phase>("intro");
  const [pulse, setPulse] = useState(0);

  const chipsMs = 500 + chips.length * 45;

  // Drive the loop while visible; reset to the start when it leaves view.
  useEffect(() => {
    if (reduce) return;
    if (!inView) {
      setPhase("intro");
      return;
    }
    const next: Record<Phase, [Phase, number]> = {
      intro: ["chips", 700],
      chips: ["fan", chipsMs],
      fan: ["hold", 1500],
      hold: ["out", HOLD_MS],
      out: ["intro", 900],
    };
    const [to, ms] = next[phase];
    const id = setTimeout(() => setPhase(to), ms);
    return () => clearTimeout(id);
  }, [phase, inView, reduce, chipsMs]);

  // During the hold, avatars take turns to pulse.
  useEffect(() => {
    if (phase !== "hold") return;
    const id = setInterval(
      () => setPulse((p) => (p + 1) % audiences.length),
      PULSE_MS,
    );
    return () => clearInterval(id);
  }, [phase, audiences.length]);

  const shown = reduce ? "hold" : phase;
  const chipsOn = shown === "chips" || shown === "fan" || shown === "hold";
  const fanOn = shown === "fan" || shown === "hold";
  const logoBig = shown === "intro" || shown === "out";

  return (
    <section
      data-surface="canvas"
      className="bg-surface text-surface-fg overflow-hidden py-16 md:py-24 xl:py-32"
    >
      <Container>
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
          <Eyebrow>{HOME_NETWORK.eyebrow}</Eyebrow>
          <Heading size="h1">
            <AccentText text={HOME_NETWORK.title} />
          </Heading>
        </div>

        <div
          ref={ref}
          className="relative mt-12 grid items-center gap-8 md:mt-16 lg:grid-cols-[1.35fr_auto_1fr] lg:gap-8 xl:gap-10"
        >
          {/* Beam: a defined band joining chips, logo and people */}
          <motion.div
            aria-hidden
            animate={{ opacity: logoBig ? 0.55 : 1 }}
            transition={{ duration: 0.8 }}
            className={cn(
              "pointer-events-none absolute blur-[5px]",
              // Horizontal on desktop
              "lg:inset-x-[-4%] lg:top-1/2 lg:h-[62%] lg:-translate-y-1/2 lg:bg-[linear-gradient(90deg,transparent,rgb(0_171_255/0.28)_16%,rgb(0_171_255/0.5)_50%,rgb(0_171_255/0.28)_84%,transparent)] lg:[mask-image:linear-gradient(180deg,transparent,#000_22%,#000_78%,transparent)]",
              // Vertical on phones/tablets
              "max-lg:inset-y-0 max-lg:left-1/2 max-lg:w-[70%] max-lg:-translate-x-1/2 max-lg:bg-[linear-gradient(180deg,transparent,rgb(0_171_255/0.24)_15%,rgb(0_171_255/0.42)_50%,rgb(0_171_255/0.24)_85%,transparent)] max-lg:[mask-image:linear-gradient(90deg,transparent,#000_25%,#000_75%,transparent)]",
            )}
          />

          {/* Chips */}
          <div className="relative flex flex-wrap justify-center gap-2 lg:justify-start">
            {chips.map((chip, i) => (
              <motion.div
                key={chip.label}
                initial={false}
                animate={
                  chipsOn
                    ? { opacity: 1, scale: 1, y: 0 }
                    : { opacity: 0, scale: 0.85, y: 8 }
                }
                transition={{
                  duration: 0.45,
                  ease: EASE,
                  delay: reduce
                    ? 0
                    : chipsOn
                      ? i * 0.045
                      : (chips.length - i) * 0.015,
                }}
              >
                <Link
                  href={chip.href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-[8px] py-1.5 pr-3 text-[0.8125rem] transition-transform duration-300 hover:-translate-y-0.5 md:text-sm",
                    chip.image ? "pl-1.5" : "pl-3",
                    CHIP_STYLES[i % CHIP_STYLES.length],
                  )}
                >
                  {chip.image && (
                    <span className="relative h-6 w-8 shrink-0 overflow-hidden rounded-[4px]">
                      <Image
                        src={stock(chip.image, 96, 72)}
                        alt=""
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    </span>
                  )}
                  {chip.label}
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Dexta tile: large between loops, settles as the chips arrive */}
          <motion.div
            initial={false}
            animate={{ scale: logoBig ? 1.7 : 1 }}
            transition={{ duration: 0.9, ease: EASE }}
            className="bg-royal relative z-10 mx-auto flex size-20 items-center justify-center rounded-[18px] shadow-[0_20px_50px_-15px_rgb(0_12_153/0.6)] md:size-24 xl:size-28"
          >
            <Image
              src="/images/dexta1.png"
              alt="Dexta"
              width={325}
              height={102}
              className="w-[72%]"
            />
          </motion.div>

          {/* People we serve + connector lines */}
          <div className="relative mx-auto h-[24rem] w-full max-w-md md:h-[26rem] lg:h-[22rem] lg:max-w-none">
            <svg
              aria-hidden
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full overflow-visible"
            >
              {audiences.map((a, i) => {
                const desktop = `M0,50 C${a.x * 0.45},50 ${a.x * 0.55},${a.y} ${a.x},${a.y}`;
                const mobile = `M50,0 C50,${a.my * 0.45} ${a.mx},${a.my * 0.55} ${a.mx},${a.my}`;
                return (
                  <g key={a.label}>
                    {[
                      { d: desktop, cls: "hidden lg:block" },
                      { d: mobile, cls: "lg:hidden" },
                    ].map(({ d, cls }) => (
                      <g key={cls} className={cls}>
                        {/* The line draws in */}
                        <motion.path
                          d={d}
                          fill="none"
                          className="stroke-brand-cyan"
                          strokeWidth={2}
                          strokeLinecap="round"
                          vectorEffect="non-scaling-stroke"
                          initial={false}
                          animate={
                            fanOn
                              ? { pathLength: 1, opacity: 0.9 }
                              : { pathLength: 0, opacity: 0 }
                          }
                          transition={{
                            duration: 0.8,
                            ease: EASE,
                            delay: reduce ? 0 : fanOn ? i * 0.07 : 0,
                          }}
                        />
                        {/* Flowing dashes on top during the hold */}
                        <path
                          d={d}
                          pathLength={1}
                          fill="none"
                          strokeWidth={3}
                          strokeLinecap="round"
                          vectorEffect="non-scaling-stroke"
                          className={cn(
                            "stroke-white transition-opacity duration-500",
                            shown === "hold"
                              ? "dx-dash-flow opacity-90"
                              : "opacity-0",
                          )}
                        />
                      </g>
                    ))}
                  </g>
                );
              })}
            </svg>

            {audiences.map((a, i) => {
              const pulsing = shown === "hold" && !reduce && pulse === i;
              return (
                <motion.figure
                  key={a.label}
                  initial={false}
                  animate={
                    fanOn
                      ? { opacity: 1, scale: pulsing ? 1.18 : 1 }
                      : { opacity: 0, scale: 0.5 }
                  }
                  transition={
                    fanOn && !pulsing
                      ? {
                          type: "spring",
                          stiffness: 260,
                          damping: 18,
                          delay:
                            reduce || shown === "hold" ? 0 : 0.3 + i * 0.08,
                        }
                      : { duration: 0.45, ease: EASE }
                  }
                  className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center [--ax:var(--mx)] [--ay:var(--my)] lg:[--ax:var(--dx)] lg:[--ay:var(--dy)]"
                  style={
                    {
                      left: "var(--ax)",
                      top: "var(--ay)",
                      "--dx": `${a.x}%`,
                      "--dy": `${a.y}%`,
                      "--mx": `${a.mx}%`,
                      "--my": `${a.my}%`,
                    } as React.CSSProperties
                  }
                >
                  <span
                    className={cn(
                      "ring-canvas relative block overflow-hidden rounded-full ring-4 transition-shadow duration-500",
                      a.size === "lg"
                        ? "size-16 xl:size-20"
                        : "size-12 xl:size-14",
                      pulsing && "shadow-[0_0_0_6px_rgb(0_171_255/0.35)]",
                    )}
                  >
                    <Image
                      src={stock(a.image, 200, 200)}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </span>
                  <figcaption
                    className={cn(
                      "relative z-10 -mt-2 rounded-full px-2.5 py-0.5 text-[0.6875rem] font-bold whitespace-nowrap shadow-sm md:text-xs",
                      CHIP_STYLES[(i + 3) % CHIP_STYLES.length],
                    )}
                  >
                    {a.label}
                  </figcaption>
                </motion.figure>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
