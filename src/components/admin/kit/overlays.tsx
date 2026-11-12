"use client";

import { forwardRef } from "react";
import { Dialog, Tabs as RadixTabs, Tooltip } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------------ */
/* Modal                                                                     */
/* ------------------------------------------------------------------------ */

/**
 * A centred dialog for short tasks (rename, pick an option, preview).
 * Slides up from the bottom on phones. For editing a whole item, use
 * SidePanel instead.
 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in-0 bg-royal/40 fixed inset-0 z-[75] backdrop-blur-[2px]" />
        <Dialog.Content
          className={cn(
            "dx-site data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=open]:zoom-in-95 fixed inset-x-0 bottom-0 z-[76] flex max-h-[92dvh] flex-col rounded-t-[18px] bg-white shadow-[0_30px_80px_-20px_rgb(0_8_107/0.45)] duration-300 sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-h-[85dvh] sm:w-[calc(100%-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[16px]",
            size === "sm" && "sm:max-w-sm",
            size === "md" && "sm:max-w-lg",
            size === "lg" && "sm:max-w-2xl",
            size === "xl" && "sm:max-w-4xl",
          )}
        >
          <header className="flex items-start justify-between gap-4 px-5 pt-5 pb-3 md:px-6 md:pt-6">
            <div className="flex min-w-0 flex-col gap-1">
              <Dialog.Title className="text-lg font-bold tracking-[-0.01em] md:text-xl">
                {title}
              </Dialog.Title>
              {description ? (
                <Dialog.Description className="text-surface-muted text-sm leading-relaxed">
                  {description}
                </Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">
                  {title}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close
              aria-label="Close"
              className="hover:bg-charcoal/[0.07] -mt-1 -mr-2 inline-flex size-10 shrink-0 items-center justify-center rounded-full outline-none focus-visible:shadow-[0_0_0_3px_rgb(0_171_255/0.35)]"
            >
              <X aria-hidden className="size-5" />
            </Dialog.Close>
          </header>
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-5 md:px-6 md:pb-6">
            {children}
          </div>
          {footer && (
            <footer className="border-surface-rule flex flex-col-reverse gap-2 border-t px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:pb-4 md:px-6">
              {footer}
            </footer>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ------------------------------------------------------------------------ */
/* Tabs                                                                      */
/* ------------------------------------------------------------------------ */

/**
 * Tabs for splitting a long editor (Content / Media / SEO). The tab row
 * scrolls sideways on phones instead of wrapping. Arrow keys move between
 * tabs.
 */
export function Tabs({
  tabs,
  value,
  onValueChange,
  defaultValue,
  label,
  className,
}: {
  tabs: {
    value: string;
    label: string;
    badge?: React.ReactNode;
    content: React.ReactNode;
  }[];
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  /** Accessible name for the tab list. */
  label: string;
  className?: string;
}) {
  return (
    <RadixTabs.Root
      value={value}
      onValueChange={onValueChange}
      defaultValue={defaultValue ?? tabs[0]?.value}
      className={cn("flex flex-col gap-6", className)}
    >
      <RadixTabs.List
        aria-label={label}
        className="border-surface-rule -mx-4 flex gap-1 overflow-x-auto border-b px-4 [scrollbar-width:none] md:mx-0 md:px-0"
      >
        {tabs.map((t) => (
          <RadixTabs.Trigger
            key={t.value}
            value={t.value}
            className="text-surface-muted hover:text-surface-fg data-[state=active]:text-royal relative inline-flex h-11 shrink-0 items-center gap-2 px-3 text-sm font-bold whitespace-nowrap outline-none after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-transparent focus-visible:shadow-[inset_0_0_0_2px_rgb(0_171_255/0.5)] data-[state=active]:after:bg-royal"
          >
            {t.label}
            {typeof t.badge === "number" || typeof t.badge === "string" ? (
              <span className="bg-charcoal/[0.07] text-surface-fg rounded-full px-2 py-0.5 text-xs tabular-nums">
                {t.badge}
              </span>
            ) : (
              t.badge
            )}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {tabs.map((t) => (
        <RadixTabs.Content
          key={t.value}
          value={t.value}
          className="outline-none"
        >
          {t.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}

/* ------------------------------------------------------------------------ */
/* Icon button with tooltip                                                  */
/* ------------------------------------------------------------------------ */

type IconButtonProps = Omit<
  React.ButtonHTMLAttributes<React.ComponentRef<"button">>,
  "children"
> & {
  /** Read by screen readers and shown as a tooltip on hover/focus. */
  label: string;
  icon: React.ReactNode;
  tone?: "default" | "danger";
  size?: "sm" | "md";
};

/**
 * A round button with only an icon. The label is the accessible name and
 * appears as a tooltip on desktop (touch screens rely on the icon).
 */
export const IconButton = forwardRef<
  React.ComponentRef<"button">,
  IconButtonProps
>(function IconButton(
  {
    label,
    icon,
    tone = "default",
    size = "md",
    className,
    type = "button",
    ...props
  },
  ref,
) {
  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            ref={ref}
            type={type}
            aria-label={label}
            className={cn(
              "inline-flex shrink-0 items-center justify-center rounded-full transition-colors outline-none focus-visible:shadow-[0_0_0_3px_rgb(0_171_255/0.35)] disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-[18px]",
              size === "md" ? "size-10" : "size-9 [&_svg]:size-4",
              tone === "danger"
                ? "hover:bg-coral-soft text-[#c2410c]"
                : "text-surface-fg hover:bg-charcoal/[0.07]",
              className,
            )}
            {...props}
          >
            <span aria-hidden className="inline-flex">
              {icon}
            </span>
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            sideOffset={6}
            className="bg-charcoal data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 z-[95] rounded-[6px] px-2.5 py-1.5 font-[family-name:var(--font-mont)] text-xs font-bold text-white"
          >
            {label}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
});
