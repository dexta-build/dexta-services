import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccentText } from "@/components/site/accent-text";

/**
 * Admin page building blocks in the site's design system: page header,
 * cards/sections, status pills, empty states and keyboard hints.
 */

export function PageHeader({
  title,
  description,
  eyebrow,
  breadcrumbs,
  actions,
}: {
  /** Use *word* for the serif accent, as on the site. */
  title: string;
  description?: React.ReactNode;
  eyebrow?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-5 md:mb-10 md:flex-row md:items-end md:justify-between">
      <div className="flex max-w-3xl flex-col gap-3">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb">
            <ol className="text-surface-muted flex flex-wrap items-center gap-1 text-sm">
              {breadcrumbs.map((b, i) => (
                <li key={`${b.label}-${i}`} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight aria-hidden className="size-3.5" />}
                  {b.href ? (
                    <Link
                      href={b.href}
                      className="dx-link hover:text-surface-fg"
                    >
                      {b.label}
                    </Link>
                  ) : (
                    <span aria-current="page">{b.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        {eyebrow && (
          <p className="text-eyebrow text-surface-muted">{eyebrow}</p>
        )}
        <h1 className="dx-heading text-[2rem] leading-[1.1] tracking-[-0.02em] md:text-[2.5rem]">
          <AccentText text={title} />
        </h1>
        {description && (
          <p className="text-surface-muted max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </header>
  );
}

export function AdminCard({
  title,
  description,
  actions,
  children,
  className,
  padded = true,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-[10px] bg-white ring-1 ring-black/[0.06]",
        padded && "p-5 md:p-6",
        className,
      )}
    >
      {(title || actions) && (
        <div
          className={cn(
            "flex flex-wrap items-start justify-between gap-3",
            padded ? "mb-5" : "border-surface-rule border-b px-5 py-4 md:px-6",
          )}
        >
          <div className="flex flex-col gap-1">
            {title && <h2 className="text-lg font-bold">{title}</h2>}
            {description && (
              <p className="text-surface-muted text-sm leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

const PILL_TONES = {
  neutral: "bg-charcoal/[0.07] text-charcoal",
  brand: "bg-ice text-royal",
  success: "bg-mint-soft text-mint-deep",
  warning: "bg-gold-soft text-gold-deep",
  danger: "bg-coral-soft text-coral-deep",
  royal: "bg-royal text-white",
} as const;

export type PillTone = keyof typeof PILL_TONES;

export function StatusPill({
  tone = "neutral",
  children,
  dot = false,
  className,
}: {
  tone?: PillTone;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap",
        PILL_TONES[tone],
        className,
      )}
    >
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-surface-rule flex flex-col items-center gap-3 rounded-[10px] border border-dashed px-6 py-14 text-center",
        className,
      )}
    >
      {icon && (
        <span
          aria-hidden
          className="bg-ice text-royal inline-flex size-12 items-center justify-center rounded-full [&_svg]:size-6"
        >
          {icon}
        </span>
      )}
      <p className="text-lg font-bold">{title}</p>
      {description && (
        <p className="text-surface-muted max-w-sm text-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="border-surface-fg/15 text-surface-muted inline-flex h-5 min-w-5 items-center justify-center rounded border bg-white px-1 font-sans text-[0.6875rem] font-bold">
      {children}
    </kbd>
  );
}
