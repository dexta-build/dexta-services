"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AccentText } from "../accent-text";
import { RevealGroup, RevealItem } from "../reveal";
import { NavIcon } from "../shell/nav-icon";
import { Price } from "./currency";
import type { CatalogueData } from "@/lib/site/catalogue-data";

/**
 * Colourful catalogue cards for /catalogue: each in its own colour, with a
 * collage of designs, the number of designs and the starting price.
 */
export function CatalogueCards({
  catalogues,
}: {
  catalogues: CatalogueData[];
}) {
  return (
    <RevealGroup className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {catalogues.map((c) => {
        const images = c.items
          .map((i) => i.media[0])
          .filter((m) => m?.kind === "image")
          .slice(0, 3)
          .map((m) => m!.src);
        const from = c.items.length
          ? Math.min(...c.items.map((i) => i.price))
          : null;
        return (
          <RevealItem key={c.slug}>
            <Link
              href={c.href}
              data-surface={c.surface}
              data-cursor="Browse"
              className="group bg-surface text-surface-fg flex h-full flex-col overflow-hidden rounded-[10px]"
            >
              <div className="grid aspect-[16/10] grid-cols-3 grid-rows-2 gap-1.5 p-1.5">
                {[c.image, ...images].slice(0, 3).map((src, idx) => (
                  <div
                    key={`${src}-${idx}`}
                    className={
                      idx === 0
                        ? "relative col-span-2 row-span-2 overflow-hidden rounded-[8px]"
                        : "relative overflow-hidden rounded-[8px]"
                    }
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="(min-width: 1280px) 22vw, (min-width: 768px) 33vw, 66vw"
                      className="object-cover transition-transform duration-700 ease-(--ease-out-expo) group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5 md:p-6">
                <div className="flex items-center gap-2">
                  <span className="bg-surface-fg/8 inline-flex size-9 items-center justify-center rounded-full">
                    <NavIcon name={c.icon} className="size-4" />
                  </span>
                  <span className="text-surface-muted text-sm">
                    {c.items.length} designs
                  </span>
                </div>
                <h2 className="dx-heading text-h2">
                  <AccentText text={`*${c.title}*`} />
                </h2>
                <p className="text-surface-muted text-sm leading-relaxed">
                  {c.description}
                </p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  {from !== null ? (
                    <span className="text-sm">
                      From <Price ngn={from} className="font-bold" />
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="inline-flex items-center gap-1 text-sm font-bold">
                    Browse
                    <ArrowUpRight
                      aria-hidden
                      className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </span>
                </div>
              </div>
            </Link>
          </RevealItem>
        );
      })}
    </RevealGroup>
  );
}
