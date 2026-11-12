import { cn } from "@/lib/utils";
import { MediaAsset } from "../media-asset";
import type { HeroProject } from "@/lib/site/home-data";

/**
 * One project card in the hero rows/columns. It is a button: clicking it
 * opens the project gallery. Shows the round "Expand" cursor on desktop.
 */
export function HeroTile({
  project,
  onOpen,
  className,
  sizes,
  duplicate = false,
}: {
  project: HeroProject;
  onOpen: (project: HeroProject) => void;
  className?: string;
  sizes: string;
  /** A visual copy in a looping strip: clickable, but hidden from keyboard and screen readers. */
  duplicate?: boolean;
}) {
  const cover = project.media[0];
  return (
    <button
      type="button"
      onClick={() => onOpen(project)}
      data-cursor="Expand +"
      aria-label={`View project: ${project.title}`}
      aria-hidden={duplicate || undefined}
      tabIndex={duplicate ? -1 : undefined}
      className={cn(
        "group relative block shrink-0 overflow-hidden rounded-[10px] bg-white/5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan",
        className,
      )}
    >
      {cover && (
        <span className="absolute inset-0 transition-transform duration-700 ease-(--ease-out-expo) group-hover:scale-105">
          <MediaAsset media={cover} sizes={sizes} />
        </span>
      )}
      <span className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 bg-gradient-to-t from-black/70 via-black/25 to-transparent p-3 pt-10 text-white">
        <span className="font-[family-name:var(--font-accent)] text-lg leading-tight">
          {project.title}
        </span>
        <span className="text-[0.6875rem] tracking-[0.12em] text-white/75 uppercase">
          {project.category}
        </span>
      </span>
    </button>
  );
}
