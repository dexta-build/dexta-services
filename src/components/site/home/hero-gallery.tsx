"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame, useReducedMotion } from "motion/react";
import { Container } from "../container";
import { Marquee } from "../marquee";
import { HeroTile } from "./hero-tile";
import { ProjectModal } from "./project-modal";
import type { HeroProject } from "@/lib/site/home-data";

/** Superside's hero drifts at about 25px per second. */
const SPEED = 25;

function fill<T>(items: T[], min: number): T[] {
  if (items.length === 0) return [];
  const out = [...items];
  while (out.length < min) out.push(...items);
  return out;
}

function rotate<T>(list: T[], by: number): T[] {
  if (list.length === 0) return list;
  const n = by % list.length;
  return [...list.slice(n), ...list.slice(0, n)];
}

/**
 * Desktop: three columns that drift up/down in an endless loop. The mouse
 * wheel over them scrolls the columns (not the page), like Superside.
 * Below 1280px: two sliding rows. Every tile opens the project gallery.
 */
export function HeroGallery({
  projects,
  copy,
}: {
  projects: HeroProject[];
  /** The hero headline, text and buttons (server-rendered). */
  copy: React.ReactNode;
}) {
  const [active, setActive] = useState<HeroProject | null>(null);
  const columns = [0, 1, 2].map((c) => fill(rotate(projects, c * 3), 5));
  const rowTiles = fill(projects, 8);

  return (
    <>
      <Container className="xl:grid xl:min-h-[656px] xl:grid-cols-2 xl:gap-16 3xl:min-h-[820px] 3xl:gap-24">
        {copy}
        <DesktopColumns columns={columns} onOpen={setActive} />
      </Container>

      {/* Phones + tablets: two rows sliding in opposite directions */}
      {rowTiles.length > 0 && (
        <div className="mt-10 flex flex-col gap-3 pb-10 md:mt-12 md:pb-12 xl:hidden">
          <Marquee
            duration={Math.round((rowTiles.length * 162) / SPEED)}
            gap="0.75rem"
            pauseOnHover
          >
            {rowTiles.map((p, i) => (
              <HeroTile
                key={`r1-${p.id}-${i}`}
                project={p}
                onOpen={setActive}
                sizes="180px"
                className="h-[200px] w-[150px] md:h-[240px] md:w-[180px]"
              />
            ))}
          </Marquee>
          <Marquee
            duration={Math.round((rowTiles.length * 192) / SPEED)}
            gap="0.75rem"
            reverse
            pauseOnHover
          >
            {rotate(rowTiles, Math.ceil(rowTiles.length / 2)).map((p, i) => (
              <HeroTile
                key={`r2-${p.id}-${i}`}
                project={p}
                onOpen={setActive}
                sizes="180px"
                className="h-[200px] w-[150px] md:h-[240px] md:w-[180px]"
              />
            ))}
          </Marquee>
        </div>
      )}

      <ProjectModal project={active} onClose={() => setActive(null)} />
    </>
  );
}

function DesktopColumns({
  columns,
  onOpen,
}: {
  columns: HeroProject[][];
  onOpen: (p: HeroProject) => void;
}) {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRefs = useRef<(HTMLDivElement | null)[]>([]);
  const offsets = useRef<number[]>([0, 0, 0]);
  const wheelPending = useRef(0);

  // Wheel over the columns scrolls them instead of the page.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      // Only when the columns are actually shown (1280px and up).
      if (el.offsetParent === null) return;
      e.preventDefault();
      wheelPending.current += e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useAnimationFrame((_, delta) => {
    const dt = Math.min(delta, 50) / 1000;
    // Ease the wheel input in over a few frames so it feels smooth.
    const wheelStep = wheelPending.current * 0.18;
    wheelPending.current -= wheelStep;

    trackRefs.current.forEach((track, i) => {
      if (!track) return;
      // One copy plus the gap between copies = one seamless loop.
      const first = track.firstElementChild as HTMLElement | null;
      const loop = first ? first.offsetHeight + 12 : 0;
      if (!loop) return;
      const direction = i % 2 === 0 ? 1 : -1;
      let next =
        offsets.current[i] + (reduce ? 0 : direction * SPEED * dt) + wheelStep;
      next = ((next % loop) + loop) % loop;
      offsets.current[i] = next;
      track.style.transform = `translate3d(0, ${-next}px, 0)`;
    });
  });

  if (columns[0].length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="dx-mask-y relative hidden h-[656px] grid-cols-3 gap-3 overflow-hidden xl:grid 3xl:h-[820px]"
    >
      {columns.map((col, i) => (
        <div key={i} className="relative h-full overflow-hidden">
          <div
            ref={(el) => {
              trackRefs.current[i] = el;
            }}
            className="flex flex-col gap-3 will-change-transform"
          >
            {/* Rendered twice so the loop is seamless. The copy stays clickable for
                mouse users but is skipped by keyboard and screen readers. */}
            {[0, 1].map((copy) => (
              <div key={copy} className="flex flex-col gap-3">
                {col.map((p, j) => (
                  <HeroTile
                    key={`${p.id}-${j}`}
                    project={p}
                    onOpen={onOpen}
                    sizes="(min-width: 1650px) 260px, 200px"
                    className="aspect-[3/4] w-full"
                    duplicate={copy === 1}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
