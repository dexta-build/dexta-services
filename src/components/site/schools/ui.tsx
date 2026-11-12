"use client";

import { forwardRef } from "react";
import { Checkbox as RadixCheckbox, Dialog as D, Slot } from "radix-ui";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Pop-up and form pieces for the We Brand Schools page, in the site's
 * design (rounded white panels, royal and cyan accents, Mont type).
 */

export const Dialog = D.Root;
export const DialogTitle = forwardRef<
  React.ComponentRef<typeof D.Title>,
  React.ComponentProps<typeof D.Title>
>(function DialogTitle({ className, ...props }, ref) {
  return (
    <D.Title
      ref={ref}
      className={cn("text-royal font-bold tracking-[-0.01em]", className)}
      {...props}
    />
  );
});
export const DialogDescription = forwardRef<
  React.ComponentRef<typeof D.Description>,
  React.ComponentProps<typeof D.Description>
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <D.Description
      ref={ref}
      className={cn("text-surface-muted text-sm leading-relaxed", className)}
      {...props}
    />
  );
});

export function DialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-2", className)} {...props} />;
}

export function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof D.Content> & { showCloseButton?: boolean }) {
  return (
    <D.Portal>
      <D.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 bg-royal/45 fixed inset-0 z-[80] backdrop-blur-[3px]" />
      <D.Content
        className={cn(
          "dx-site data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 fixed top-1/2 left-1/2 z-[81] grid w-full max-w-[calc(100%-1.5rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-[18px] bg-white p-6 text-charcoal shadow-[0_40px_100px_-30px_rgb(0_8_107/0.5)] duration-300 outline-none sm:max-w-lg",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <D.Close
            aria-label="Close"
            className="text-royal hover:bg-ice absolute top-3 right-3 z-20 inline-flex size-10 items-center justify-center rounded-full bg-white/90 transition-colors outline-none focus-visible:shadow-[0_0_0_3px_rgb(0_171_255/0.4)]"
          >
            <X aria-hidden className="size-5" />
          </D.Close>
        )}
      </D.Content>
    </D.Portal>
  );
}

type ButtonProps = React.ComponentProps<"button"> & {
  variant?: "default" | "outline";
  asChild?: boolean;
};

/** Pill buttons; `className` can resize or recolour them. */
export const Button = forwardRef<React.ComponentRef<"button">, ButtonProps>(
  function Button({ variant = "default", asChild, className, ...props }, ref) {
    const Comp = asChild ? Slot.Root : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold whitespace-nowrap transition-[background-color,color,box-shadow,transform] duration-300 outline-none focus-visible:shadow-[0_0_0_3px_rgb(0_171_255/0.45)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
          variant === "default"
            ? "bg-royal hover:bg-brand text-white"
            : "border-royal/20 text-royal hover:bg-royal border bg-white hover:text-white",
          className,
        )}
        {...props}
      />
    );
  },
);

const control =
  "border-charcoal/20 focus:border-brand-cyan focus:ring-brand-cyan/15 w-full rounded-[8px] border bg-white px-4 text-[0.9375rem] text-charcoal outline-none transition-[border-color,box-shadow] placeholder:text-[#737773] focus:ring-4 aria-invalid:border-coral";

export const Input = forwardRef<
  React.ComponentRef<"input">,
  React.InputHTMLAttributes<React.ComponentRef<"input">>
>(function Input({ className, ...props }, ref) {
  return (
    <input ref={ref} className={cn(control, "h-12", className)} {...props} />
  );
});

export const Textarea = forwardRef<
  React.ComponentRef<"textarea">,
  React.TextareaHTMLAttributes<React.ComponentRef<"textarea">>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(control, "min-h-24 py-3 leading-relaxed", className)}
      {...props}
    />
  );
});

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn("text-charcoal text-sm font-bold", className)}
      {...props}
    />
  );
}

export function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof RadixCheckbox.Root>) {
  return (
    <RadixCheckbox.Root
      className={cn(
        "border-charcoal/30 data-[state=checked]:bg-royal data-[state=checked]:border-royal inline-flex size-5 shrink-0 items-center justify-center rounded-[5px] border bg-white outline-none focus-visible:shadow-[0_0_0_3px_rgb(0_171_255/0.4)]",
        className,
      )}
      {...props}
    >
      <RadixCheckbox.Indicator>
        <Check aria-hidden className="size-3.5 text-white" strokeWidth={3} />
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );
}
