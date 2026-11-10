import { cn } from "@/lib/utils";

export function IconTile({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-surface-fg/6 text-surface-fg inline-flex size-12 items-center justify-center rounded-[10px] [&_svg]:size-5 [&_svg]:stroke-[1.5]",
        className,
      )}
      {...props}
    />
  );
}
