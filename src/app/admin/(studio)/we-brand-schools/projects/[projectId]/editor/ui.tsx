"use client";

import { forwardRef } from "react";
import { Dialog as RadixDialog, Slot, Switch as RadixSwitch } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { control } from "@/components/admin/kit/fields";

/**
 * The website editor's controls in the admin's design (light, rounded,
 * royal accents). Same props as the controls it used before, so the
 * editor's layout code stays as it was.
 */

type ButtonProps = React.ButtonHTMLAttributes<React.ComponentRef<"button">> & {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
  asChild?: boolean;
};

export const Button = forwardRef<React.ComponentRef<"button">, ButtonProps>(
  function Button(
    { variant = "default", size = "default", asChild, className, ...props },
    ref,
  ) {
    const Comp = asChild ? Slot.Root : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex shrink-0 items-center justify-center gap-0.5 rounded-full font-bold whitespace-nowrap transition-[background-color,color,box-shadow] outline-none focus-visible:shadow-[0_0_0_3px_rgb(0_171_255/0.35)] disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0",
          size === "default" && "h-9 px-4 text-[0.8125rem]",
          size === "sm" && "h-8 px-3 text-xs",
          size === "icon" && "size-9",
          variant === "default" &&
            "bg-royal text-white hover:shadow-[0_10px_30px_-12px_var(--color-royal)]",
          variant === "outline" &&
            "bg-charcoal/[0.06] text-charcoal hover:bg-charcoal/[0.11]",
          variant === "ghost" && "text-charcoal hover:bg-charcoal/[0.06]",
          className,
        )}
        {...props}
      />
    );
  },
);

export function Badge({
  className,
  children,
}: {
  variant?: "outline" | "default";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "bg-charcoal/[0.07] text-charcoal inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap",
        className,
      )}
    >
      {children}
    </span>
  );
}

export const Input = forwardRef<
  React.ComponentRef<"input">,
  React.InputHTMLAttributes<React.ComponentRef<"input">>
>(function Input({ className, type, ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        type === "range"
          ? "accent-royal h-8 w-full cursor-pointer"
          : cn(control, "h-10 text-sm"),
        className,
      )}
      {...props}
    />
  );
});

export const Textarea = forwardRef<
  React.ComponentRef<"textarea">,
  React.TextareaHTMLAttributes<React.ComponentRef<"textarea">>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(control, "py-2.5 text-sm leading-relaxed", className)}
      {...props}
    />
  );
});

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  ...props
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
  id?: string;
}) {
  return (
    <RadixSwitch.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className="data-[state=checked]:bg-royal bg-charcoal/20 relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors outline-none focus-visible:shadow-[0_0_0_3px_rgb(0_171_255/0.35)] disabled:cursor-not-allowed disabled:opacity-50"
      {...props}
    >
      <RadixSwitch.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
    </RadixSwitch.Root>
  );
}

export const Dialog = RadixDialog.Root;

export function DialogContent({
  className,
  children,
  showCloseButton,
}: {
  className?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
}) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in-0 bg-royal/40 fixed inset-0 z-[75] backdrop-blur-[2px]" />
      <RadixDialog.Content
        aria-describedby={undefined}
        className={cn(
          "dx-site data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-[76] flex -translate-x-1/2 -translate-y-1/2 flex-col bg-white shadow-[0_30px_80px_-20px_rgb(0_8_107/0.45)] sm:rounded-[16px]",
          className,
        )}
      >
        {children}
        {showCloseButton && (
          <RadixDialog.Close
            aria-label="Close"
            className="hover:bg-charcoal/[0.07] absolute top-2.5 right-2.5 inline-flex size-9 items-center justify-center rounded-full outline-none focus-visible:shadow-[0_0_0_3px_rgb(0_171_255/0.35)]"
          >
            <X aria-hidden className="size-5" />
          </RadixDialog.Close>
        )}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

export const DialogTitle = RadixDialog.Title;
