import { cn } from "@/lib/utils";

type TagChipProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "outline" | "solid" | "soft";
  size?: "sm" | "md";
};

export function TagChip({
  tone = "soft",
  size = "sm",
  className,
  ...props
}: TagChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full whitespace-nowrap",
        size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm",
        tone === "outline" && "border border-current",
        tone === "solid" && "bg-surface-fg text-surface",
        tone === "soft" && "bg-surface-fg/8",
        className,
      )}
      {...props}
    />
  );
}
