"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { AccentText } from "../accent-text";
import { Container } from "../container";
import { Eyebrow } from "../eyebrow";
import { Heading } from "../heading";
import { ProjectModal } from "../home/project-modal";
import { WorkTile } from "./work-tile";
import type { Pillar, WorkProject } from "@/lib/site/works-data";

export type WorksFilter = "all" | "design" | "build" | "print";

const FILTERS: { key: WorksFilter; label: string; pillar?: Pillar }[] = [
  { key: "all", label: "All work" },
  { key: "design", label: "Design", pillar: "DESIGN" },
  { key: "build", label: "Build", pillar: "BUILD" },
  { key: "print", label: "Print", pillar: "PRINT" },
];

/**
 * The Works gallery: a featured row, Design/Build/Print filters (kept in the
 * URL so filtered views can be shared) and Superside's edge-to-edge grid.
 *
 * Opening a tile follows Superside's rule:
 * - Projects with more than 4 images open the full-screen project view.
 * - Projects with 4 or fewer expand in place (from 768px). Tiles open and
 *   close independently, so opening one never changes another.
 * - Phones always get the full-screen sheet.
 */
const MAX_IN_PLACE = 4;
export function WorksGallery({
  works,
  initialFilter,
}: {
  works: WorkProject[];
  initialFilter: WorksFilter;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [filter, setFilter] = useState<WorksFilter>(initialFilter);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [sheet, setSheet] = useState<WorkProject | null>(null);

  const featured = useMemo(
    () => works.filter((w) => w.featured).slice(0, 2),
    [works],
  );
  const featuredIds = useMemo(
    () => new Set(featured.map((w) => w.id)),
    [featured],
  );

  const counts = useMemo(() => {
    const c: Record<WorksFilter, number> = {
      all: works.length,
      design: 0,
      build: 0,
      print: 0,
    };
    for (const w of works) c[w.pillar.toLowerCase() as WorksFilter] += 1;
    return c;
  }, [works]);

  // "All" hides the featured pair (shown above); a pillar filter shows everything in it.
  const visible = useMemo(() => {
    const pillar = FILTERS.find((f) => f.key === filter)?.pillar;
    return pillar
      ? works.filter((w) => w.pillar === pillar)
      : works.filter((w) => !featuredIds.has(w.id));
  }, [works, filter, featuredIds]);

  const choose = (next: WorksFilter) => {
    setFilter(next);
    setExpanded(new Set());
    const query = next === "all" ? "" : `?service=${next}`;
    router.replace(`${pathname}${query}`, { scroll: false });
  };

  // Escape closes any expanded tiles.
  useEffect(() => {
    if (expanded.size === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(new Set());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  const toggle = (work: WorkProject) => {
    const phone = window.matchMedia("(max-width: 767px)").matches;
    if (phone || work.media.length > MAX_IN_PLACE) {
      setSheet(work);
      return;
    }
    setExpanded((cur) => {
      const next = new Set(cur);
      if (next.has(work.id)) next.delete(work.id);
      else next.add(work.id);
      return next;
    });
  };

  return (
    <>
      {/* Featured */}
      {featured.length > 0 && filter === "all" && (
        <section data-surface="canvas" className="bg-surface text-surface-fg">
          <Container className="pb-8 md:pb-10">
            <Eyebrow>Featured work</Eyebrow>
          </Container>
          <div className="grid md:grid-cols-2">
            {featured.map((w) => (
              <WorkTile
                key={w.id}
                work={w}
                large
                expanded={expanded.has(w.id)}
                onToggle={() => toggle(w)}
                className="aspect-[4/5] md:aspect-square"
              />
            ))}
          </div>
        </section>
      )}

      {/* Filters + grid */}
      <section data-surface="canvas" className="bg-surface text-surface-fg">
        <Container className="flex flex-col gap-6 pt-16 pb-8 md:flex-row md:items-end md:justify-between md:pt-24 md:pb-10">
          <Heading size="h1">
            <AccentText
              text={
                filter === "all" ? "More *of our work*" : `Our *${filter}* work`
              }
            />
          </Heading>
          <div
            role="tablist"
            aria-label="Filter work by service"
            className="dx-no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0"
          >
            {FILTERS.map((f) => {
              const active = f.key === filter;
              return (
                <button
                  key={f.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => choose(f.key)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm whitespace-nowrap transition-colors",
                    active
                      ? "bg-surface-fg text-surface border-transparent"
                      : "border-surface-fg/25 hover:border-surface-fg",
                  )}
                >
                  {f.label}
                  <span
                    className={cn(
                      "text-xs tabular-nums",
                      active ? "opacity-70" : "text-surface-muted",
                    )}
                  >
                    {counts[f.key]}
                  </span>
                </button>
              );
            })}
          </div>
        </Container>

        <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid md:grid-cols-2"
          >
            {visible.map((w, i) => (
              <WorkTile
                key={w.id}
                work={w}
                expanded={expanded.has(w.id)}
                onToggle={() => toggle(w)}
                // Alternate row heights like Superside: wide, then tall.
                className={cn(
                  "aspect-[4/5] md:aspect-auto",
                  Math.floor(i / 2) % 2 === 0
                    ? "md:h-[min(46vw,640px)]"
                    : "md:h-[min(56vw,780px)]",
                )}
              />
            ))}
            {visible.length === 0 && (
              <p className="text-surface-muted col-span-full px-4 py-20 text-center">
                No {filter} projects yet. Check back soon.
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      <ProjectModal
        project={sheet}
        onClose={() => setSheet(null)}
        href={sheet ? `/works/${sheet.slug}` : undefined}
      />
    </>
  );
}
