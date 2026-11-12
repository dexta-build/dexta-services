"use client";

import { forwardRef, useId } from "react";
import { Checkbox as RadixCheckbox, Switch as RadixSwitch } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Admin form fields in the site's design system. Every field has a visible
 * label, optional hint and error, and is wired up for screen readers.
 */

/** Shared input style, for custom controls built on <Field>. */
export const control =
  "w-full rounded-[8px] border border-charcoal/[0.18] bg-white px-3.5 text-[0.9375rem] text-charcoal outline-none transition-[border-color,box-shadow] placeholder:text-[#737773] focus:border-brand focus:shadow-[0_0_0_3px_rgb(0_171_255/0.2)] disabled:cursor-not-allowed disabled:bg-canvas disabled:opacity-70 aria-[invalid=true]:border-[#c2410c]";

type FieldProps = {
  label: string;
  hint?: React.ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  /** Render the label visually hidden (still read by screen readers). */
  hideLabel?: boolean;
  /** Shown at the end of the label row, e.g. a character counter. */
  aside?: React.ReactNode;
  children: (ids: {
    id: string;
    describedBy?: string;
    invalid: boolean;
  }) => React.ReactNode;
};

export function Field({
  label,
  hint,
  error,
  required,
  className,
  hideLabel,
  aside,
  children,
}: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div
        className={cn(
          "flex items-baseline justify-between gap-3",
          hideLabel && !aside && "contents",
        )}
      >
        <label
          htmlFor={id}
          className={cn(
            "text-sm font-bold text-charcoal",
            hideLabel && "sr-only",
          )}
        >
          {label}
          {required && (
            <span aria-hidden className="text-[#c2410c]">
              {" "}
              *
            </span>
          )}
        </label>
        {aside}
      </div>
      {children({ id, describedBy, invalid: !!error })}
      {hint && !error && (
        <p id={hintId} className="text-surface-muted text-xs leading-relaxed">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-xs font-bold text-[#c2410c]"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/** "42/60" beside the label when a controlled field has a maxLength. */
function Counter({ value, max }: { value: unknown; max?: number }) {
  if (!max || typeof value !== "string") return null;
  const near = value.length >= max * 0.9;
  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        near ? "font-bold text-[#c2410c]" : "text-surface-muted",
      )}
    >
      <span className="sr-only">Characters used: </span>
      {value.length}/{max}
    </span>
  );
}

type InputProps = React.InputHTMLAttributes<React.ComponentRef<"input">> & {
  label: string;
  hint?: React.ReactNode;
  error?: string;
  hideLabel?: boolean;
  fieldClassName?: string;
  /** Element shown inside the input on the right (e.g. a show-password toggle). */
  trailing?: React.ReactNode;
  /** Fixed text before the value, e.g. "₦" or "https://". */
  prefix?: string;
};

export const TextField = forwardRef<React.ComponentRef<"input">, InputProps>(
  function TextField(
    {
      label,
      hint,
      error,
      hideLabel,
      fieldClassName,
      className,
      trailing,
      prefix,
      required,
      ...props
    },
    ref,
  ) {
    return (
      <Field
        label={label}
        hint={hint}
        error={error}
        required={required}
        hideLabel={hideLabel}
        className={fieldClassName}
        aside={<Counter value={props.value} max={props.maxLength} />}
      >
        {({ id, describedBy, invalid }) => (
          <div
            className={cn(
              "relative",
              prefix &&
                "border-charcoal/[0.18] focus-within:border-brand flex h-12 items-center rounded-[8px] border bg-white transition-[border-color,box-shadow] focus-within:shadow-[0_0_0_3px_rgb(0_171_255/0.2)]",
              prefix && invalid && "border-[#c2410c]",
            )}
          >
            {prefix && (
              <span
                aria-hidden
                className="text-surface-muted shrink-0 pl-3.5 text-[0.9375rem] select-none"
              >
                {prefix}
              </span>
            )}
            <input
              ref={ref}
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              required={required}
              className={cn(
                prefix
                  ? "h-full min-w-0 flex-1 bg-transparent pr-3.5 pl-0.5 text-[0.9375rem] outline-none placeholder:text-[#737773]"
                  : cn(control, "h-12"),
                trailing && "pr-12",
                className,
              )}
              {...props}
            />
            {trailing && (
              <span className="absolute inset-y-0 right-1.5 flex items-center">
                {trailing}
              </span>
            )}
          </div>
        )}
      </Field>
    );
  },
);

type TextareaProps = React.TextareaHTMLAttributes<
  React.ComponentRef<"textarea">
> & {
  label: string;
  hint?: React.ReactNode;
  error?: string;
  fieldClassName?: string;
};

export const TextareaField = forwardRef<
  React.ComponentRef<"textarea">,
  TextareaProps
>(function TextareaField(
  {
    label,
    hint,
    error,
    fieldClassName,
    className,
    required,
    rows = 4,
    ...props
  },
  ref,
) {
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={fieldClassName}
      aside={<Counter value={props.value} max={props.maxLength} />}
    >
      {({ id, describedBy, invalid }) => (
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          required={required}
          className={cn(control, "py-3 leading-relaxed", className)}
          {...props}
        />
      )}
    </Field>
  );
});

type SelectProps = React.SelectHTMLAttributes<React.ComponentRef<"select">> & {
  label: string;
  hint?: React.ReactNode;
  error?: string;
  options: { value: string; label: string }[];
  hideLabel?: boolean;
  fieldClassName?: string;
};

export const SelectField = forwardRef<
  React.ComponentRef<"select">,
  SelectProps
>(function SelectField(
  {
    label,
    hint,
    error,
    options,
    hideLabel,
    fieldClassName,
    className,
    required,
    ...props
  },
  ref,
) {
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      hideLabel={hideLabel}
      className={fieldClassName}
    >
      {({ id, describedBy, invalid }) => (
        <div className="relative">
          <select
            ref={ref}
            id={id}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            required={required}
            className={cn(
              control,
              "h-12 cursor-pointer appearance-none pr-10",
              className,
            )}
            {...props}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden
            className="text-surface-muted pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2"
          />
        </div>
      )}
    </Field>
  );
});

/** On/off switch with a label and optional description. */
export function SwitchField({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  name,
}: {
  label: string;
  description?: React.ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  name?: string;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <label htmlFor={id} className="flex cursor-pointer flex-col gap-0.5">
        <span className="text-sm font-bold">{label}</span>
        {description && (
          <span className="text-surface-muted text-xs leading-relaxed">
            {description}
          </span>
        )}
      </label>
      <RadixSwitch.Root
        id={id}
        name={name}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="data-[state=checked]:bg-royal relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-charcoal/20 transition-colors outline-none focus-visible:shadow-[0_0_0_3px_rgb(0_171_255/0.35)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RadixSwitch.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
      </RadixSwitch.Root>
    </div>
  );
}

/** Checkbox with a label and optional description. */
export function CheckboxField({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string;
  description?: React.ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <RadixCheckbox.Root
        id={id}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        disabled={disabled}
        className="data-[state=checked]:bg-royal data-[state=checked]:border-royal mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-[5px] border border-charcoal/30 bg-white outline-none focus-visible:shadow-[0_0_0_3px_rgb(0_171_255/0.35)] disabled:opacity-50"
      >
        <RadixCheckbox.Indicator>
          <Check aria-hidden className="size-3.5 text-white" strokeWidth={3} />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      <label htmlFor={id} className="flex cursor-pointer flex-col gap-0.5">
        <span className="text-sm font-bold leading-snug">{label}</span>
        {description && (
          <span className="text-surface-muted text-xs leading-relaxed">
            {description}
          </span>
        )}
      </label>
    </div>
  );
}

/** A labelled group of fields with an optional description, for long forms. */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border-surface-rule grid min-w-0 grid-cols-1 gap-6 border-t pt-6 first:border-t-0 first:pt-0 md:grid-cols-[minmax(0,16rem)_1fr] md:gap-10">
      <div className="flex flex-col gap-1">
        <legend className="text-base font-bold">{title}</legend>
        {description && (
          <p className="text-surface-muted text-sm leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </fieldset>
  );
}
