import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Pill buttons. "primary" uses the section's CTA colours, so the same
 * button is royal blue on light sections and cyan on dark ones.
 */
export const buttonVariants = cva(
  "group/btn relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-bold whitespace-nowrap transition-[background-color,color,box-shadow,transform] duration-300 ease-(--ease-out-expo) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface-accent disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-cta text-cta-fg hover:shadow-[0_10px_30px_-10px_var(--surface-cta-bg)]",
        outline:
          "border border-surface-fg/80 text-surface-fg hover:bg-surface-fg hover:text-surface",
        ghost: "text-surface-fg h-auto! px-0!",
      },
      size: {
        md: "h-12 px-6 text-sm",
        lg: "h-14 px-8 text-[0.9375rem]",
      },
      block: {
        true: "w-full",
        mobile: "w-full md:w-auto",
        false: "",
      },
    },
    defaultVariants: { variant: "primary", size: "md", block: false },
  },
);

type StyleProps = VariantProps<typeof buttonVariants> & {
  /** Show the arrow icon, which nudges up-right on hover. */
  arrow?: boolean;
  className?: string;
  children: React.ReactNode;
};

type LinkProps = StyleProps & {
  href: string;
  external?: boolean;
} & Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    "href" | "className" | "children"
  >;

type NativeButtonProps = StyleProps & { href?: undefined } & Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "className" | "children"
  >;

function ButtonInner({
  arrow,
  ghost,
  children,
}: {
  arrow?: boolean;
  ghost: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      <span
        className={cn("inline-flex items-center gap-2", ghost && "dx-link")}
      >
        {children}
      </span>
      {arrow && (
        <ArrowUpRight
          aria-hidden
          className="size-4 transition-transform duration-300 ease-(--ease-out-expo) group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
        />
      )}
    </>
  );
}

export function Button(props: LinkProps | NativeButtonProps) {
  if (props.href !== undefined) {
    const {
      variant,
      size,
      block,
      arrow,
      className,
      children,
      href,
      external,
      ...rest
    } = props;
    const classes = cn(buttonVariants({ variant, size, block }), className);
    const inner = (
      <ButtonInner arrow={arrow} ghost={variant === "ghost"}>
        {children}
      </ButtonInner>
    );
    return external ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        {...rest}
      >
        {inner}
      </a>
    ) : (
      <Link href={href} className={classes} {...rest}>
        {inner}
      </Link>
    );
  }

  const {
    variant,
    size,
    block,
    arrow,
    className,
    children,
    type = "button",
    ...rest
  } = props;
  delete (rest as { href?: unknown }).href;
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...rest}
    >
      <ButtonInner arrow={arrow} ghost={variant === "ghost"}>
        {children}
      </ButtonInner>
    </button>
  );
}
