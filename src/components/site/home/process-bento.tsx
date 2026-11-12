"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";
import { Check, Loader2 } from "lucide-react";
import { AccentText } from "../accent-text";
import { Button } from "../button";
import { Container } from "../container";
import { Eyebrow } from "../eyebrow";
import { Heading } from "../heading";
import { Section } from "../section";
import { HOME_PROCESS } from "@/lib/site/home-content";
import { stock, STOCK } from "@/lib/site/stock-media";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Superside's "One intelligent system" bento, retold for Dexta: a tall
 * WhatsApp-style chat card, a wide progress card with a ticking checklist,
 * a brand-kit collage and a "pay your way" currency card.
 */
type Link = { label: string; href: string };

/** Section content: the built-in copy plus the editable buttons and images. */
export type ProcessContent = Omit<
  typeof HOME_PROCESS,
  "chat" | "progress" | "brandKit"
> & {
  primary?: Link;
  secondary?: Link;
  chat: typeof HOME_PROCESS.chat & { image?: string };
  progress: typeof HOME_PROCESS.progress & { image?: string };
  brandKit: typeof HOME_PROCESS.brandKit & { imageA?: string; imageB?: string };
};

export function ProcessBento({
  content = HOME_PROCESS,
}: {
  content?: ProcessContent;
} = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.25 });
  const reduce = useReducedMotion();
  const active = Boolean(reduce) || inView;

  return (
    <Section>
      <Container>
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-end lg:gap-16">
          <div className="flex flex-col gap-4">
            <Eyebrow>{content.eyebrow}</Eyebrow>
            <Heading size="h1">
              <AccentText text={content.title} />
            </Heading>
          </div>
          <div className="flex flex-col gap-5">
            <p className="text-surface-muted leading-relaxed">{content.body}</p>
            <div className="flex flex-col gap-3 md:flex-row">
              <Button href={content.primary?.href ?? "/contact"} block="mobile">
                {content.primary?.label ?? "Start a project"}
              </Button>
              <Button
                href={content.secondary?.href ?? "/catalogue"}
                variant="outline"
                block="mobile"
              >
                {content.secondary?.label ?? "Browse catalogues"}
              </Button>
            </div>
          </div>
        </div>

        <div
          ref={ref}
          className="mt-10 grid gap-4 md:mt-14 md:grid-cols-2 lg:grid-cols-3 lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]"
        >
          <ChatCard active={active} chat={content.chat} />
          <ProgressCard active={active} progress={content.progress} />
          <BrandKitCard brandKit={content.brandKit} />
          <CurrencyCard active={active} currency={content.currency} />
        </div>
      </Container>
    </Section>
  );
}

/* ---------- Tall card: order on WhatsApp ---------- */

function ChatCard({
  active,
  chat,
}: {
  active: boolean;
  chat: ProcessContent["chat"];
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) return;
    const id = setTimeout(
      () => setStep((s) => (s + 1) % (chat.messages.length + 2)),
      step === 0 ? 700 : 1700,
    );
    return () => clearTimeout(id);
  }, [active, step, chat.messages.length]);

  const visible = chat.messages.slice(0, Math.min(step, chat.messages.length));
  const typing =
    step > 0 &&
    step < chat.messages.length &&
    chat.messages[step]?.from === "dexta";

  return (
    <article className="relative flex min-h-[30rem] flex-col justify-between overflow-hidden rounded-[10px] text-white md:row-span-2 lg:min-h-[44rem]">
      <Image
        src={stock(chat.image ?? STOCK.friendsSunset, 900, 1300)}
        alt=""
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        className="object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-royal/80 via-royal/30 to-royal/85"
      />
      <div className="relative p-6 md:p-7">
        <h3 className="dx-heading text-h2 [&_em]:text-brand-cyan">
          <AccentText text={chat.title} />
        </h3>
      </div>

      <div
        className="relative flex flex-col gap-2 p-4 md:p-5"
        aria-live="polite"
      >
        <AnimatePresence initial={false}>
          {visible.map((m, i) => (
            <motion.p
              key={`${i}-${m.text}`}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              className={
                m.from === "client"
                  ? "max-w-[85%] self-end rounded-2xl rounded-br-sm bg-[#dcf8c6] px-3.5 py-2 text-sm text-charcoal"
                  : "max-w-[85%] self-start rounded-2xl rounded-bl-sm bg-white px-3.5 py-2 text-sm text-charcoal"
              }
            >
              {m.text}
            </motion.p>
          ))}
          {typing && (
            <motion.span
              key="typing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex gap-1 self-start rounded-2xl rounded-bl-sm bg-white px-3.5 py-3"
            >
              {[0, 1, 2].map((d) => (
                <span
                  key={d}
                  className="size-1.5 animate-bounce rounded-full bg-grey-muted"
                  style={{ animationDelay: `${d * 0.15}s` }}
                />
              ))}
            </motion.span>
          )}
        </AnimatePresence>
        <p className="mt-2 text-sm text-white/80">{chat.caption}</p>
      </div>
    </article>
  );
}

/* ---------- Wide card: brief to delivery ---------- */

function ProgressCard({
  active,
  progress,
}: {
  active: boolean;
  progress: ProcessContent["progress"];
}) {
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (!active) return;
    const id = setTimeout(
      () => setDone((d) => (d >= progress.steps.length ? 0 : d + 1)),
      done >= progress.steps.length ? 2600 : 1100,
    );
    return () => clearTimeout(id);
  }, [active, done, progress.steps.length]);

  return (
    <article className="relative grid min-h-[22rem] overflow-hidden rounded-[10px] text-white md:col-span-1 lg:col-span-2 lg:grid-cols-2">
      <Image
        src={stock(progress.image ?? STOCK.teamWhiteboard, 1400, 800)}
        alt=""
        fill
        sizes="(min-width: 1024px) 66vw, 100vw"
        className="object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-ocean/95 via-ocean/75 to-ocean/30"
      />
      <div className="relative flex flex-col gap-3 p-6 md:p-7">
        <h3 className="dx-heading text-h2 [&_em]:text-ice">
          <AccentText text={progress.title} />
        </h3>
        <p className="max-w-sm text-sm leading-relaxed text-white/85">
          {progress.body}
        </p>
      </div>
      <div className="relative flex items-center justify-center p-6 pt-0 lg:pt-6">
        <ol className="flex w-full max-w-[16rem] flex-col items-stretch rounded-2xl bg-white/90 p-3 text-charcoal shadow-xl backdrop-blur">
          {progress.steps.map((s, i) => {
            const state = i < done ? "done" : i === done ? "doing" : "todo";
            return (
              <li
                key={s}
                className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm"
              >
                <span
                  className={
                    state === "done"
                      ? "flex size-6 items-center justify-center rounded-full bg-mint text-white"
                      : state === "doing"
                        ? "flex size-6 items-center justify-center rounded-full bg-ice text-ocean"
                        : "flex size-6 items-center justify-center rounded-full border border-black/15"
                  }
                >
                  {state === "done" ? (
                    <Check className="size-3.5" strokeWidth={3} />
                  ) : state === "doing" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : null}
                </span>
                <span
                  className={state === "todo" ? "text-grey-muted" : "font-bold"}
                >
                  {s}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </article>
  );
}

/* ---------- Small card: brand kit collage ---------- */

function BrandKitCard({ brandKit }: { brandKit: ProcessContent["brandKit"] }) {
  return (
    <article
      data-surface="ice"
      className="bg-surface text-surface-fg relative flex min-h-[22rem] flex-col overflow-hidden rounded-[10px] p-6 md:p-7"
    >
      <h3 className="dx-heading text-h3 font-bold">
        <AccentText text={brandKit.title} />
      </h3>
      <p className="text-surface-muted mt-2 max-w-xs text-sm leading-relaxed">
        {brandKit.body}
      </p>
      <div className="relative mt-auto h-40">
        <div className="absolute bottom-0 left-0 h-28 w-24 overflow-hidden rounded-lg shadow-lg">
          <Image
            src={stock(brandKit.imageA ?? STOCK.colourSwatches, 300, 360)}
            alt=""
            fill
            sizes="96px"
            className="object-cover"
          />
        </div>
        <div className="absolute bottom-4 left-20 h-32 w-28 -rotate-3 overflow-hidden rounded-lg shadow-lg">
          <Image
            src={stock(brandKit.imageB ?? STOCK.typeOnTablet, 300, 360)}
            alt=""
            fill
            sizes="112px"
            className="object-cover"
          />
        </div>
        <div className="absolute right-4 bottom-8 flex size-20 items-center justify-center rounded-lg bg-brand-cyan/30 text-4xl text-royal shadow-lg backdrop-blur">
          Aa
        </div>
        <div className="absolute right-12 bottom-0 flex size-16 rotate-6 items-center justify-center rounded-lg bg-white text-3xl italic font-[family-name:var(--font-accent)] text-royal shadow-lg">
          Aa
        </div>
      </div>
    </article>
  );
}

/* ---------- Small card: pay your way ---------- */

function CurrencyCard({
  active,
  currency,
}: {
  active: boolean;
  currency: typeof HOME_PROCESS.currency;
}) {
  const symbols = ["₦", "$", "€", "£"];
  return (
    <article
      data-surface="mint"
      className="bg-surface text-surface-fg relative flex min-h-[22rem] md:col-span-2 lg:col-span-1 flex-col overflow-hidden rounded-[10px] p-6 md:p-7"
    >
      <h3 className="dx-heading text-h3 font-bold">
        <AccentText text={currency.title} />
      </h3>
      <p className="text-surface-muted mt-2 max-w-xs text-sm leading-relaxed">
        {currency.body}
      </p>
      <div className="relative mt-auto flex h-40 items-center justify-center">
        <svg
          aria-hidden
          viewBox="0 0 200 120"
          className="absolute inset-0 h-full w-full"
        >
          {[
            "M100,60 C70,60 60,22 30,22",
            "M100,60 C70,60 60,98 30,98",
            "M100,60 C130,60 140,22 170,22",
            "M100,60 C130,60 140,98 170,98",
          ].map((d, i) => (
            <motion.path
              key={d}
              d={d}
              fill="none"
              className="stroke-mint-deep/40"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              animate={active ? { pathLength: 1 } : {}}
              transition={{ duration: 0.8, delay: i * 0.12, ease: EASE }}
            />
          ))}
        </svg>
        <span className="relative z-10 flex size-16 items-center justify-center rounded-2xl bg-royal shadow-lg">
          <Image
            src="/images/dexta1.png"
            alt=""
            width={325}
            height={102}
            className="w-[74%]"
          />
        </span>
        {symbols.map((s, i) => (
          <motion.span
            key={s}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={active ? { opacity: 1, scale: 1 } : {}}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 16,
              delay: 0.5 + i * 0.12,
            }}
            className="absolute flex size-11 items-center justify-center rounded-xl bg-white text-lg font-bold text-mint-deep shadow-md"
            style={{
              left: i < 2 ? "8%" : undefined,
              right: i >= 2 ? "8%" : undefined,
              top: i % 2 === 0 ? "4%" : undefined,
              bottom: i % 2 === 1 ? "4%" : undefined,
            }}
          >
            {s}
          </motion.span>
        ))}
      </div>
    </article>
  );
}
