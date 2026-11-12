"use client";

import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A drawer from the right for editing one item without leaving the list.
 * Full screen on phones. Put the form in `children` and its buttons in
 * `footer` (stays visible while the body scrolls).
 */
export function SidePanel({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  width = "md",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: "md" | "lg" | "xl" | "2xl";
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 fixed inset-0 z-[70] bg-royal/30 backdrop-blur-[2px]" />
        <Dialog.Content
          className={cn(
            "dx-site data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right fixed inset-y-0 right-0 z-[71] flex w-full flex-col bg-canvas shadow-[-30px_0_80px_-30px_rgb(0_8_107/0.4)] duration-300 sm:rounded-l-[16px]",
            width === "md" && "sm:max-w-lg",
            width === "lg" && "sm:max-w-2xl",
            width === "xl" && "sm:max-w-4xl",
            width === "2xl" && "sm:max-w-4xl xl:max-w-6xl",
          )}
        >
          <header className="border-surface-rule flex items-start justify-between gap-4 border-b bg-white px-5 py-4 sm:rounded-tl-[16px] md:px-7 md:py-5">
            <div className="flex min-w-0 flex-col gap-1">
              <Dialog.Title className="truncate text-lg font-bold tracking-[-0.01em] md:text-xl">
                {title}
              </Dialog.Title>
              {description ? (
                <Dialog.Description className="text-surface-muted text-sm leading-relaxed">
                  {description}
                </Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">
                  Edit {title}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close
              aria-label="Close panel"
              className="hover:bg-charcoal/[0.07] -mr-2 inline-flex size-10 shrink-0 items-center justify-center rounded-full transition-colors outline-none focus-visible:shadow-[0_0_0_3px_rgb(0_171_255/0.35)]"
            >
              <X aria-hidden className="size-5" />
            </Dialog.Close>
          </header>
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-6 md:px-7">
            {children}
          </div>
          {footer && (
            <footer className="border-surface-rule flex flex-wrap items-center justify-end gap-2 border-t bg-white px-5 py-4 sm:rounded-bl-[16px] md:px-7">
              {footer}
            </footer>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
