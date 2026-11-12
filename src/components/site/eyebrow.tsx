import { cn } from "@/lib/utils";

type EyebrowProps = React.HTMLAttributes<HTMLParagraphElement> & {
  /** Thin rule under the label, as on Superside's light sections. */
  rule?: boolean;
};

export function Eyebrow({
  rule = false,
  className,
  children,
  ...props
}: EyebrowProps) {
  return (
    <p
      className={cn(
        "text-eyebrow text-surface-fg/80",
        rule && "border-surface-rule border-b pb-3",
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}
