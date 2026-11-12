"use client";

import { forwardRef, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccentText } from "@/components/site/accent-text";
import { Button } from "@/components/site/button";
import { TextField } from "@/components/admin/kit/fields";

export function AuthHeading({
  title,
  description,
}: {
  title: string;
  description?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-3">
      <h1 className="dx-heading text-[2.25rem] leading-[1.05] tracking-[-0.025em] md:text-[2.75rem]">
        <AccentText text={title} />
      </h1>
      {description && (
        <p className="text-surface-muted leading-relaxed">{description}</p>
      )}
    </div>
  );
}

export function FormAlert({
  tone = "error",
  children,
}: {
  tone?: "error" | "success";
  children: React.ReactNode;
}) {
  const Icon = tone === "error" ? AlertCircle : CheckCircle2;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-[10px] px-4 py-3 text-sm leading-relaxed",
        tone === "error"
          ? "bg-coral-soft text-coral-deep"
          : "bg-mint-soft text-mint-deep",
      )}
    >
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

type PasswordProps = Omit<
  React.ComponentProps<typeof TextField>,
  "type" | "trailing"
>;

/** Password input with a show/hide toggle. */
export const PasswordField = forwardRef<
  React.ComponentRef<"input">,
  PasswordProps
>(function PasswordField(props, ref) {
  const [show, setShow] = useState(false);
  return (
    <TextField
      ref={ref}
      type={show ? "text" : "password"}
      {...props}
      trailing={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          className="text-surface-muted hover:text-surface-fg inline-flex size-9 items-center justify-center rounded-full"
        >
          {show ? (
            <EyeOff aria-hidden className="size-4" />
          ) : (
            <Eye aria-hidden className="size-4" />
          )}
        </button>
      }
    />
  );
});

export function SubmitButton({
  pending,
  pendingLabel,
  children,
}: {
  pending: boolean;
  pendingLabel: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="submit"
      block
      size="lg"
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? (
        <>
          <Loader2 aria-hidden className="size-4 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
