"use client";

import { useEffect, useId, useRef, useState } from "react";
import { RadioGroup } from "radix-ui";
import {
  ChevronDown,
  ChevronUp,
  Link2,
  Pencil,
  Plus,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { control, Field } from "./fields";
import { slugify } from "@/lib/slugify";

export { slugify };

/* ------------------------------------------------------------------------ */
/* Search                                                                    */
/* ------------------------------------------------------------------------ */

/** Pill search box used in list toolbars. */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={cn("relative block", className)}>
      <span className="sr-only">{placeholder}</span>
      <Search
        aria-hidden
        className="text-surface-muted pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border-charcoal/[0.14] focus:border-brand h-10 w-full rounded-full border bg-white pr-4 pl-10 text-sm outline-none placeholder:text-[#737773] focus:shadow-[0_0_0_3px_rgb(0_171_255/0.2)]"
      />
    </label>
  );
}

/* ------------------------------------------------------------------------ */
/* Numbers and prices                                                        */
/* ------------------------------------------------------------------------ */

/**
 * Number input with optional prefix/suffix (e.g. "₦", "%", "days").
 * Shows thousands separators while not focused. `value` is a number or
 * null (empty).
 */
export function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  min,
  max,
  step = 1,
  hint,
  error,
  required,
  placeholder,
  className,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  hint?: React.ReactNode;
  error?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState("");
  const shown = focused
    ? draft
    : value == null
      ? ""
      : value.toLocaleString("en-GB", { maximumFractionDigits: 2 });

  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      {({ id, describedBy, invalid }) => (
        <div
          className={cn(
            control,
            "flex h-12 items-center gap-2 focus-within:border-brand focus-within:shadow-[0_0_0_3px_rgb(0_171_255/0.2)]",
            invalid && "border-[#c2410c]",
          )}
        >
          {prefix && (
            <span aria-hidden className="text-surface-muted shrink-0">
              {prefix}
            </span>
          )}
          <input
            id={id}
            inputMode="decimal"
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            required={required}
            placeholder={placeholder}
            value={shown}
            onFocus={() => {
              setDraft(value == null ? "" : String(value));
              setFocused(true);
            }}
            onBlur={() => setFocused(false)}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^\d.-]/g, "");
              setDraft(raw);
              if (raw === "" || raw === "-") return onChange(null);
              let n = Number(raw);
              if (Number.isNaN(n)) return;
              if (min != null) n = Math.max(min, n);
              if (max != null) n = Math.min(max, n);
              onChange(n);
            }}
            onKeyDown={(e) => {
              if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
              e.preventDefault();
              let n = (value ?? 0) + (e.key === "ArrowUp" ? step : -step);
              if (min != null) n = Math.max(min, n);
              if (max != null) n = Math.min(max, n);
              setDraft(String(n));
              onChange(n);
            }}
            className="h-full min-w-0 flex-1 bg-transparent tabular-nums outline-none"
          />
          {suffix && (
            <span aria-hidden className="text-surface-muted shrink-0 text-sm">
              {suffix}
            </span>
          )}
        </div>
      )}
    </Field>
  );
}

/* ------------------------------------------------------------------------ */
/* Slug                                                                      */
/* ------------------------------------------------------------------------ */

/**
 * The page address for an item. Follows `source` (usually the title) until
 * the user edits it by hand. Shows the full path, e.g. /thoughts/my-post.
 */
export function SlugField({
  value,
  onChange,
  source,
  basePath,
  label = "Page address",
  error,
}: {
  value: string;
  onChange: (slug: string) => void;
  source: string;
  /** e.g. "/thoughts/" */
  basePath: string;
  label?: string;
  error?: string;
}) {
  const [manual, setManual] = useState(
    () => !!value && value !== slugify(source),
  );
  const [editing, setEditing] = useState(false);
  const slug = manual ? value : slugify(source);
  // Keep the parent in step while following the title.
  useEffect(() => {
    if (!manual && slug !== value) onChange(slug);
  }, [manual, slug, value, onChange]);

  return (
    <Field label={label} error={error}>
      {({ id, describedBy, invalid }) =>
        editing ? (
          <div
            className={cn(
              control,
              "flex h-12 items-center focus-within:border-brand focus-within:shadow-[0_0_0_3px_rgb(0_171_255/0.2)]",
              invalid && "border-[#c2410c]",
            )}
          >
            <span aria-hidden className="text-surface-muted shrink-0 text-sm">
              {basePath}
            </span>
            <input
              id={id}
              autoFocus
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              value={value}
              onChange={(e) => {
                setManual(true);
                // Keep a trailing dash while typing ("daniel-" → "daniel-azu");
                // the address is tidied when the field is left.
                onChange(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]+/g, "-")
                    .replace(/-{2,}/g, "-")
                    .replace(/^-/, ""),
                );
              }}
              onBlur={() => {
                setEditing(false);
                const clean = slugify(value);
                if (clean !== value) onChange(clean);
                if (!clean) setManual(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </div>
        ) : (
          <div className="bg-canvas flex min-h-12 items-center gap-2 rounded-[8px] px-3.5 py-2">
            <Link2 aria-hidden className="text-surface-muted size-4 shrink-0" />
            <span id={id} className="min-w-0 flex-1 truncate text-sm">
              <span className="text-surface-muted">{basePath}</span>
              <strong>{slug || "…"}</strong>
            </span>
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-describedby={describedBy}
              className="text-royal hover:bg-ice inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-bold"
            >
              <Pencil aria-hidden className="size-3.5" /> Edit
            </button>
          </div>
        )
      }
    </Field>
  );
}

/* ------------------------------------------------------------------------ */
/* Tags                                                                      */
/* ------------------------------------------------------------------------ */

/**
 * Short labels as removable chips: tools, skills, languages, keywords.
 * Enter or comma adds; Backspace on an empty input removes the last one.
 */
export function TagInput({
  label,
  value,
  onChange,
  suggestions = [],
  placeholder = "Type and press Enter",
  hint,
  error,
  max,
}: {
  label: string;
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  hint?: React.ReactNode;
  error?: string;
  max?: number;
}) {
  const [text, setText] = useState("");
  const listId = useId();
  const inputRef = useRef<React.ComponentRef<"input">>(null);
  const full = max != null && value.length >= max;

  const add = (raw: string) => {
    const tag = raw.trim().replace(/,$/, "").trim();
    if (!tag || full) return;
    if (value.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
    onChange([...value, tag]);
    setText("");
  };

  return (
    <Field
      label={label}
      hint={hint ?? (max ? `Up to ${max}.` : undefined)}
      error={error}
      aside={
        max ? (
          <span className="text-surface-muted text-xs tabular-nums">
            {value.length}/{max}
          </span>
        ) : undefined
      }
    >
      {({ id, describedBy, invalid }) => (
        <div
          onClick={() => inputRef.current?.focus()}
          className={cn(
            control,
            "flex min-h-12 cursor-text flex-wrap items-center gap-1.5 py-2 focus-within:border-brand focus-within:shadow-[0_0_0_3px_rgb(0_171_255/0.2)]",
            invalid && "border-[#c2410c]",
          )}
        >
          <ul className="contents" aria-label={`${label} added`}>
            {value.map((tag) => (
              <li
                key={tag}
                className="bg-ice text-royal inline-flex h-8 items-center gap-1 rounded-full pr-1 pl-3 text-sm font-bold"
              >
                {tag}
                <button
                  type="button"
                  aria-label={`Remove ${tag}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(value.filter((t) => t !== tag));
                  }}
                  className="hover:bg-royal/10 inline-flex size-6 items-center justify-center rounded-full"
                >
                  <X aria-hidden className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <input
            ref={inputRef}
            id={id}
            list={suggestions.length ? listId : undefined}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            disabled={full}
            value={text}
            placeholder={value.length ? "" : placeholder}
            onChange={(e) => {
              const v = e.target.value;
              if (v.endsWith(",")) add(v);
              else setText(v);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add(text);
              } else if (e.key === "Backspace" && !text && value.length) {
                onChange(value.slice(0, -1));
              }
            }}
            onBlur={() => text && add(text)}
            className="h-8 min-w-[8rem] flex-1 bg-transparent text-[0.9375rem] outline-none placeholder:text-[#737773]"
          />
          {suggestions.length > 0 && (
            <datalist id={listId}>
              {suggestions
                .filter((s) => !value.includes(s))
                .map((s) => (
                  <option key={s} value={s} />
                ))}
            </datalist>
          )}
        </div>
      )}
    </Field>
  );
}

/* ------------------------------------------------------------------------ */
/* List of lines                                                             */
/* ------------------------------------------------------------------------ */

/**
 * An ordered list of short texts: offer features, bullet points, facts.
 * Add, edit, remove and move lines up or down.
 */
export function ListEditor({
  label,
  value,
  onChange,
  placeholder = "Add a line",
  addLabel = "Add line",
  hint,
  max,
}: {
  label: string;
  value: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  addLabel?: string;
  hint?: React.ReactNode;
  max?: number;
}) {
  const refs = useRef<(React.ComponentRef<"input"> | null)[]>([]);
  const groupId = useId();
  const set = (i: number, v: string) =>
    onChange(value.map((x, j) => (j === i ? v : x)));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    onChange(next);
  };
  const add = (at = value.length) => {
    if (max != null && value.length >= max) return;
    const next = [...value];
    next.splice(at, 0, "");
    onChange(next);
    window.setTimeout(() => refs.current[at]?.focus(), 0);
  };

  return (
    <fieldset
      className="flex min-w-0 flex-col gap-2"
      aria-describedby={hint ? `${groupId}-hint` : undefined}
    >
      <legend className="mb-1.5 text-sm font-bold">{label}</legend>
      {value.length > 0 && (
        <ol className="flex flex-col gap-2">
          {value.map((item, i) => (
            <li key={i} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="text-surface-muted w-5 shrink-0 text-right text-xs tabular-nums"
              >
                {i + 1}
              </span>
              <input
                ref={(el) => {
                  refs.current[i] = el;
                }}
                value={item}
                aria-label={`${label}, line ${i + 1}`}
                placeholder={placeholder}
                onChange={(e) => set(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    add(i + 1);
                  } else if (e.key === "Backspace" && !item && value.length) {
                    e.preventDefault();
                    onChange(value.filter((_, j) => j !== i));
                    window.setTimeout(
                      () => refs.current[Math.max(0, i - 1)]?.focus(),
                      0,
                    );
                  }
                }}
                className={cn(control, "h-11 min-w-0 flex-1")}
              />
              <div className="flex shrink-0">
                <IconBtn
                  label={`Move line ${i + 1} up`}
                  disabled={i === 0}
                  onClick={() => move(i, i - 1)}
                >
                  <ChevronUp />
                </IconBtn>
                <IconBtn
                  label={`Move line ${i + 1} down`}
                  disabled={i === value.length - 1}
                  onClick={() => move(i, i + 1)}
                >
                  <ChevronDown />
                </IconBtn>
                <IconBtn
                  label={`Remove line ${i + 1}`}
                  onClick={() => onChange(value.filter((_, j) => j !== i))}
                >
                  <X />
                </IconBtn>
              </div>
            </li>
          ))}
        </ol>
      )}
      <button
        type="button"
        onClick={() => add()}
        disabled={max != null && value.length >= max}
        className="text-royal hover:bg-ice border-charcoal/[0.18] inline-flex h-11 items-center justify-center gap-1.5 rounded-[8px] border border-dashed text-sm font-bold disabled:opacity-40"
      >
        <Plus aria-hidden className="size-4" /> {addLabel}
      </button>
      {hint && (
        <p
          id={`${groupId}-hint`}
          className="text-surface-muted text-xs leading-relaxed"
        >
          {hint}
        </p>
      )}
    </fieldset>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="text-surface-muted hover:bg-ice hover:text-royal inline-flex size-9 items-center justify-center rounded-full disabled:opacity-30 [&_svg]:size-4"
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------------ */
/* Segmented choice                                                          */
/* ------------------------------------------------------------------------ */

/**
 * Pick one of a few options shown side by side (Draft / Published,
 * Grid / List). Scrolls sideways on narrow screens instead of wrapping.
 */
export function SegmentedControl<V extends string>({
  label,
  value,
  onChange,
  options,
  hideLabel,
  size = "md",
}: {
  label: string;
  value: V;
  onChange: (value: V) => void;
  options: { value: V; label: string; icon?: React.ReactNode }[];
  hideLabel?: boolean;
  size?: "sm" | "md";
}) {
  const id = useId();
  return (
    <div className="flex max-w-full flex-col gap-1.5">
      <span id={id} className={cn("text-sm font-bold", hideLabel && "sr-only")}>
        {label}
      </span>
      <RadioGroup.Root
        aria-labelledby={id}
        value={value}
        onValueChange={(v) => onChange(v as V)}
        orientation="horizontal"
        className="bg-charcoal/[0.06] inline-flex max-w-full gap-1 self-start overflow-x-auto rounded-full p-1 [scrollbar-width:none]"
      >
        {options.map((o) => (
          <RadioGroup.Item
            key={o.value}
            value={o.value}
            className={cn(
              "text-surface-muted data-[state=checked]:text-royal inline-flex shrink-0 items-center gap-1.5 rounded-full font-bold whitespace-nowrap transition-colors outline-none focus-visible:shadow-[0_0_0_3px_rgb(0_171_255/0.35)] data-[state=checked]:bg-white data-[state=checked]:shadow-sm [&_svg]:size-4",
              size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm",
            )}
          >
            {o.icon && <span aria-hidden>{o.icon}</span>}
            {o.label}
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Dates                                                                     */
/* ------------------------------------------------------------------------ */

function toLocalInput(d: Date | null, withTime: boolean) {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return withTime
    ? `${date}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    : date;
}

/**
 * Date, or date and time, using the device's own picker (best on phones).
 * Times are in the viewer's time zone; Nigeria is WAT (UTC+1).
 */
export function DateTimeField({
  label,
  value,
  onChange,
  withTime = true,
  min,
  hint,
  error,
  required,
  clearable = true,
}: {
  label: string;
  value: Date | null;
  onChange: (value: Date | null) => void;
  withTime?: boolean;
  min?: Date;
  hint?: React.ReactNode;
  error?: string;
  required?: boolean;
  clearable?: boolean;
}) {
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      {({ id, describedBy, invalid }) => (
        <div className="relative">
          <input
            id={id}
            type={withTime ? "datetime-local" : "date"}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            required={required}
            min={min ? toLocalInput(min, withTime) : undefined}
            value={toLocalInput(value, withTime)}
            onChange={(e) =>
              onChange(e.target.value ? new Date(e.target.value) : null)
            }
            className={cn(control, "h-12", clearable && value && "pr-12")}
          />
          {clearable && value && (
            <button
              type="button"
              aria-label={`Clear ${label}`}
              onClick={() => onChange(null)}
              className="text-surface-muted hover:text-surface-fg absolute inset-y-0 right-1.5 my-auto inline-flex size-9 items-center justify-center rounded-full"
            >
              <X aria-hidden className="size-4" />
            </button>
          )}
        </div>
      )}
    </Field>
  );
}

/* ------------------------------------------------------------------------ */
/* Colour                                                                    */
/* ------------------------------------------------------------------------ */

/** The site's palette, offered first so colours stay on brand. */
export const BRAND_SWATCHES = [
  { name: "Brand blue", value: "#000c99" },
  { name: "Royal", value: "#00086b" },
  { name: "Cyan", value: "#00abff" },
  { name: "Ocean", value: "#007fc2" },
  { name: "Gold", value: "#d4a340" },
  { name: "Lilac", value: "#a996f2" },
  { name: "Coral", value: "#ff7a5c" },
  { name: "Mint", value: "#34c9a0" },
  { name: "Stone", value: "#8c8578" },
  { name: "Charcoal", value: "#202321" },
];

export function ColorField({
  label,
  value,
  onChange,
  hint,
  swatches = BRAND_SWATCHES,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  hint?: React.ReactNode;
  swatches?: { name: string; value: string }[];
}) {
  const [text, setText] = useState(value);
  const valid = /^#[0-9a-f]{6}$/i.test(text);
  return (
    <Field
      label={label}
      hint={hint}
      error={text && !valid ? "Use a hex colour like #000c99." : undefined}
    >
      {({ id, describedBy, invalid }) => (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <label className="relative size-12 shrink-0 cursor-pointer overflow-hidden rounded-[8px] ring-1 ring-black/10">
              <span className="sr-only">Pick a colour</span>
              <span
                aria-hidden
                className="absolute inset-0"
                style={{ background: valid ? text : value }}
              />
              <input
                type="color"
                value={valid ? text : value}
                onChange={(e) => {
                  setText(e.target.value);
                  onChange(e.target.value);
                }}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
            <input
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              value={text}
              maxLength={7}
              onChange={(e) => {
                const v = e.target.value.startsWith("#")
                  ? e.target.value
                  : `#${e.target.value}`;
                setText(v);
                if (/^#[0-9a-f]{6}$/i.test(v)) onChange(v.toLowerCase());
              }}
              className={cn(control, "h-12 w-36 font-mono text-sm uppercase")}
            />
          </div>
          <div
            role="group"
            aria-label="Brand colours"
            className="flex flex-wrap gap-2"
          >
            {swatches.map((s) => {
              const active = s.value.toLowerCase() === value.toLowerCase();
              return (
                <button
                  key={s.value}
                  type="button"
                  title={s.name}
                  aria-label={s.name}
                  aria-pressed={active}
                  onClick={() => {
                    setText(s.value);
                    onChange(s.value);
                  }}
                  className={cn(
                    "size-9 rounded-full ring-1 ring-black/10 transition-transform hover:scale-110 sm:size-8",
                    active && "ring-royal ring-2 ring-offset-2",
                  )}
                  style={{ background: s.value }}
                />
              );
            })}
          </div>
        </div>
      )}
    </Field>
  );
}
