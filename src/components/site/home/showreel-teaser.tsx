"use client";

import { VideoPlayer } from "@/components/site/video-player";
import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Dialog } from "radix-ui";
import { Play, Volume2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ShowreelTeaserProps = {
  /** Words that slide across in the kinetic opening. */
  words: string[];
  /** Images for the collage phase. */
  images: string[];
  /** Full video that plays (with sound) when the play button is pressed. */
  video: string;
  className?: string;
};

const PHASE_MS = { words: 4200, collage: 4200 };

/**
 * Looping teaser like Superside's "creative advantage" video: giant words
 * slide across, then a collage of work fades in. Pressing play opens the
 * full showreel with sound in a modal.
 */
export function ShowreelTeaser({
  words,
  images,
  video,
  className,
}: ShowreelTeaserProps) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<"words" | "collage">("words");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (reduce) return;
    const id = setTimeout(
      () => setPhase((p) => (p === "words" ? "collage" : "words")),
      PHASE_MS[phase],
    );
    return () => clearTimeout(id);
  }, [phase, reduce]);

  const current = reduce ? "collage" : phase;
  const line = words.join(" · ") + " · ";

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          "bg-royal relative aspect-[16/10] overflow-hidden rounded-[10px]",
          className,
        )}
      >
        <AnimatePresence mode="wait">
          {current === "words" ? (
            <motion.div
              key="words"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex items-center"
            >
              <motion.p
                initial={{ x: "8%" }}
                animate={{ x: "-55%" }}
                transition={{
                  duration: PHASE_MS.words / 1000 + 0.4,
                  ease: "linear",
                }}
                className="text-brand-cyan text-[clamp(4rem,14vw,10rem)] leading-none font-black tracking-[-0.04em] whitespace-nowrap"
              >
                {line}
                {line}
              </motion.p>
            </motion.div>
          ) : (
            <motion.div
              key="collage"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-1.5 p-1.5"
            >
              {images.slice(0, 6).map((src, i) => (
                <motion.div
                  key={src}
                  initial={{ opacity: 0, scale: 1.12 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.7,
                    delay: reduce ? 0 : i * 0.12,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={cn(
                    "relative overflow-hidden rounded-md",
                    i === 0 && "row-span-2",
                  )}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 20vw, 33vw"
                    className="object-cover"
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sound hint, top right (the full video has sound) */}
        <span
          aria-hidden
          className="bg-royal/70 text-ice absolute top-4 right-4 inline-flex size-10 items-center justify-center rounded-full backdrop-blur"
        >
          <Volume2 className="size-4" />
        </span>

        <Dialog.Trigger
          aria-label="Play our showreel"
          data-cursor="Play"
          className="group absolute inset-0 flex items-center justify-center"
        >
          <span className="bg-royal/80 text-ice flex h-16 w-24 items-center justify-center rounded-[10px] backdrop-blur transition-transform duration-300 ease-(--ease-out-expo) group-hover:scale-110">
            <Play className="size-7 fill-current" />
          </span>
        </Dialog.Trigger>
      </div>

      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-[100] bg-[#00042f]/92 backdrop-blur-md" />
        <Dialog.Content
          aria-describedby={undefined}
          className="data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98] fixed inset-0 z-[101] flex items-center justify-center p-4 outline-none md:p-10"
        >
          <Dialog.Title className="sr-only">Dexta showreel</Dialog.Title>
          <VideoPlayer
            src={video}
            autoPlay
            label="Dexta showreel"
            className="aspect-video max-h-full w-full max-w-6xl rounded-[10px]"
            videoClassName="object-contain"
          />
          <Dialog.Close
            aria-label="Close"
            className="text-ice absolute top-4 right-4 inline-flex size-12 items-center justify-center rounded-full border border-white/40 transition-colors hover:bg-white hover:text-royal md:top-6 md:right-6"
          >
            <X className="size-5" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
