"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { TeamCard } from "./team-card";
import type { TeamMember } from "@/lib/site/team-data";

/**
 * Swipeable row of tall team cards with arrow buttons, like Superside's
 * executive team. Cards snap into place; arrows hide at either end.
 */
export function TeamCarousel({
  members,
  className,
}: {
  members: TeamMember[];
  className?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft < 8,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8,
    });
  }, []);

  useEffect(() => {
    update();
    const el = track.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const step = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const amount = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <div className={cn("relative", className)}>
      <div
        ref={track}
        className="dx-no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2 md:-mx-8 md:px-8 xl:-mx-12 xl:px-12"
      >
        {members.map((m, i) => (
          <div
            key={m.id}
            data-card
            className="w-[72%] shrink-0 snap-start sm:w-[46%] md:w-[31%] xl:w-[23%]"
          >
            <TeamCard member={m} priority={i < 2} />
          </div>
        ))}
      </div>

      {!(edges.start && edges.end) && (
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            aria-label="Previous team members"
            disabled={edges.start}
            onClick={() => step(-1)}
            className="border-surface-fg/30 hover:bg-surface-fg hover:text-surface inline-flex size-12 items-center justify-center rounded-full border transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-current"
          >
            <ArrowLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Next team members"
            disabled={edges.end}
            onClick={() => step(1)}
            className="border-surface-fg/30 hover:bg-surface-fg hover:text-surface inline-flex size-12 items-center justify-center rounded-full border transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-current"
          >
            <ArrowRight className="size-5" />
          </button>
        </div>
      )}
    </div>
  );
}
