"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Copy,
  Info,
  OctagonX,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------------ */
/* Callout                                                                   */
/* ------------------------------------------------------------------------ */

const CALLOUT = {
  info: { cls: "bg-ice text-royal", icon: Info },
  success: { cls: "bg-mint-soft text-mint-deep", icon: CheckCircle2 },
  warning: { cls: "bg-gold-soft text-gold-deep", icon: AlertTriangle },
  danger: { cls: "bg-coral-soft text-coral-deep", icon: OctagonX },
} as const;

/** A note inside a page: tips, warnings, "this is live on the site". */
export function Callout({
  tone = "info",
  title,
  children,
  action,
  className,
}: {
  tone?: keyof typeof CALLOUT;
  title?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  const { cls, icon: Icon } = CALLOUT[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "flex flex-col gap-3 rounded-[10px] px-4 py-3.5 text-sm leading-relaxed sm:flex-row sm:items-start",
        cls,
        className,
      )}
    >
      <div className="flex flex-1 items-start gap-2.5">
        <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
        <div className="flex flex-col gap-0.5">
          {title && <p className="font-bold">{title}</p>}
          {children && <div className="opacity-90">{children}</div>}
        </div>
      </div>
      {action && <div className="shrink-0 pl-6.5 sm:pl-0">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Stat card                                                                 */
/* ------------------------------------------------------------------------ */

/** A number with a label, for dashboards and list headers. */
export function StatCard({
  label,
  value,
  icon,
  change,
  href,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  /** e.g. { value: "+12%", trend: "up", note: "vs last week" } */
  change?: { value: string; trend: "up" | "down" | "flat"; note?: string };
  href?: string;
}) {
  const body = (
    <>
      {icon && (
        <span
          aria-hidden
          className="bg-ice text-royal inline-flex size-11 shrink-0 items-center justify-center rounded-full [&_svg]:size-5"
        >
          {icon}
        </span>
      )}
      <span className="flex min-w-0 flex-col">
        <span className="text-[1.75rem] leading-none font-bold tracking-[-0.02em] tabular-nums">
          {value}
        </span>
        <span className="text-surface-muted mt-1 text-sm">{label}</span>
        {change && (
          <span
            className={cn(
              "mt-1.5 text-xs font-bold",
              change.trend === "up" && "text-mint-deep",
              change.trend === "down" && "text-coral-deep",
              change.trend === "flat" && "text-surface-muted",
            )}
          >
            {change.value}
            {change.note && (
              <span className="text-surface-muted font-normal">
                {" "}
                {change.note}
              </span>
            )}
          </span>
        )}
      </span>
      {href && (
        <ArrowUpRight
          aria-hidden
          className="text-surface-muted ml-auto size-4 shrink-0 self-start transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      )}
    </>
  );
  const cls =
    "group flex items-center gap-4 rounded-[10px] bg-white p-5 ring-1 ring-black/[0.06]";
  return href ? (
    <Link
      href={href}
      className={cn(
        cls,
        "transition-shadow hover:shadow-[0_18px_40px_-24px_rgb(0_8_107/0.45)]",
      )}
    >
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/* ------------------------------------------------------------------------ */
/* Skeletons                                                                 */
/* ------------------------------------------------------------------------ */

export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "bg-charcoal/[0.07] block animate-pulse rounded-[8px]",
        className,
      )}
    />
  );
}

/** Placeholder for a list while it loads. */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex flex-col rounded-[10px] bg-white ring-1 ring-black/[0.06]"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="border-surface-rule flex items-center gap-4 border-b px-4 py-4 last:border-b-0"
        >
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="hidden h-6 w-20 rounded-full sm:block" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Avatar                                                                    */
/* ------------------------------------------------------------------------ */

export function Avatar({
  name,
  src,
  size = "md",
}: {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?";
  const dim = {
    sm: "size-7 text-[0.625rem]",
    md: "size-9 text-xs",
    lg: "size-14 text-base",
  }[size];
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element -- small, remote, any host
    <img
      src={src}
      alt=""
      className={cn("shrink-0 rounded-full object-cover", dim)}
    />
  ) : (
    <span
      aria-hidden
      className={cn(
        "bg-royal inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white",
        dim,
      )}
    >
      {initials}
    </span>
  );
}

/* ------------------------------------------------------------------------ */
/* Copy button                                                               */
/* ------------------------------------------------------------------------ */

/** Copies text (a link, an ID) and confirms with a tick. */
export function CopyButton({
  value,
  label = "Copy",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        } catch {
          // Clipboard blocked: leave the text selectable instead.
        }
      }}
      className={cn(
        "text-royal hover:bg-ice inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition-colors",
        className,
      )}
    >
      {copied ? (
        <Check aria-hidden className="size-3.5" />
      ) : (
        <Copy aria-hidden className="size-3.5" />
      )}
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </button>
  );
}

/* ------------------------------------------------------------------------ */
/* Details list                                                              */
/* ------------------------------------------------------------------------ */

/** Label/value pairs, e.g. an item's details in a side panel. */
export function DetailList({
  items,
  columns = 2,
}: {
  items: { label: string; value: React.ReactNode }[];
  columns?: 1 | 2 | 3;
}) {
  return (
    <dl
      className={cn(
        "grid gap-x-6 gap-y-4 rounded-[10px] bg-white p-4 text-sm ring-1 ring-black/[0.06]",
        columns >= 2 && "grid-cols-2",
        columns === 3 && "md:grid-cols-3",
      )}
    >
      {items.map((it) => (
        <div key={it.label} className="flex min-w-0 flex-col gap-0.5">
          <dt className="text-surface-muted text-xs">{it.label}</dt>
          <dd className="truncate font-bold">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
