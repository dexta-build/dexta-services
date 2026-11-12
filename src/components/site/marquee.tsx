import { cn } from "@/lib/utils";

type MarqueeProps = {
  children: React.ReactNode;
  /** Scroll axis. Vertical is used for the desktop hero columns. */
  axis?: "x" | "y";
  /** Reverse the direction of travel. */
  reverse?: boolean;
  /** Seconds for one full loop. Superside's hero moves about 25px per second. */
  duration?: number;
  gap?: string;
  pauseOnHover?: boolean;
  /** Fade the edges. */
  fade?: boolean;
  className?: string;
  trackClassName?: string;
};

/**
 * Infinite CSS marquee. Content renders twice and the track slides by 50%,
 * so it loops seamlessly. No JS, and it stops for reduced-motion users.
 */
export function Marquee({
  children,
  axis = "x",
  reverse = false,
  duration = 40,
  gap = "1rem",
  pauseOnHover = false,
  fade = false,
  className,
  trackClassName,
}: MarqueeProps) {
  const isX = axis === "x";
  const style = {
    "--marquee-name": isX ? "dx-marquee-x" : "dx-marquee-y",
    "--marquee-duration": `${duration}s`,
    "--marquee-direction": reverse ? "reverse" : "normal",
  } as React.CSSProperties;

  const group = (hidden: boolean) => (
    <div
      aria-hidden={hidden || undefined}
      // The copy exists only for the seamless loop: keep it out of the tab
      // order and away from assistive technology.
      inert={hidden || undefined}
      className={cn("flex shrink-0", isX ? "flex-row" : "flex-col")}
      style={isX ? { gap, paddingRight: gap } : { gap, paddingBottom: gap }}
    >
      {children}
    </div>
  );

  return (
    <div
      className={cn(
        "dx-marquee overflow-hidden",
        fade && (isX ? "dx-mask-x" : "dx-mask-y"),
        className,
      )}
      data-pause-on-hover={pauseOnHover}
      style={style}
    >
      <div
        className={cn(
          "dx-marquee-track flex",
          isX ? "w-max flex-row" : "h-max flex-col",
          trackClassName,
        )}
      >
        {group(false)}
        {group(true)}
      </div>
    </div>
  );
}
