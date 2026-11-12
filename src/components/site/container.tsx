import { cn } from "@/lib/utils";

type ContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  /** "default" ≈ Superside's 1216px content width; "wide" for full-bleed-ish grids. */
  size?: "default" | "wide" | "narrow";
};

const sizes = {
  narrow: "max-w-[52rem]",
  default: "max-w-[82rem] 3xl:max-w-[94rem]",
  wide: "max-w-[100rem]",
};

export function Container({
  size = "default",
  className,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 md:px-8 xl:px-12",
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
