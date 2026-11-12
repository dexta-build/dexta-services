import { cn } from "@/lib/utils";

export type Surface =
  | "canvas"
  | "white"
  | "ice"
  | "royal"
  | "brand"
  | "ocean"
  | "gold"
  | "lilac"
  | "coral"
  | "mint"
  | "stone"
  | "plum"
  | "forest";

type SectionProps = React.HTMLAttributes<HTMLElement> & {
  surface?: Surface;
  /** Vertical rhythm. "none" for full-bleed media sections. */
  spacing?: "none" | "sm" | "md" | "lg";
  as?: "section" | "div" | "header" | "footer" | "article";
};

const spacings = {
  none: "",
  sm: "py-12 md:py-16 xl:py-20",
  md: "py-16 md:py-24 xl:py-32",
  lg: "py-20 md:py-32 xl:py-40",
};

/**
 * A colour-blocked page section. Everything inside (eyebrows, heading
 * accents, buttons, rules) picks up the surface's colours automatically.
 */
export function Section({
  surface = "canvas",
  spacing = "md",
  as: Tag = "section",
  className,
  ...props
}: SectionProps) {
  return (
    <Tag
      data-surface={surface}
      className={cn(
        "bg-surface text-surface-fg relative",
        spacings[spacing],
        className,
      )}
      {...props}
    />
  );
}
