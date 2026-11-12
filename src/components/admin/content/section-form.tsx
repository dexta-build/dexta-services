"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  Film,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Field, Fields } from "@/lib/content/fields";
import {
  CheckboxField,
  SelectField,
  SwitchField,
  TextareaField,
  TextField,
} from "@/components/admin/kit/fields";
import { ListEditor, NumberField } from "@/components/admin/kit/inputs";
import { IconButton } from "@/components/admin/kit/overlays";
import { MediaPickerDialog } from "@/components/admin/media/media-picker";
import { mediaValue, type MediaAssetDTO } from "@/lib/media/shared";
import { isVideoSource, stock } from "@/lib/site/stock-media";
import { MediaValueField } from "./media-value-field";

type Data = Record<string, unknown>;
type Errors = Record<string, string>;

const ACCENT_HINT = "Wrap words in *asterisks* for the serif italic accent.";

/** An empty value for a new list item. */
function emptyFor(field: Field): unknown {
  switch (field.type) {
    case "number":
      return 0;
    case "toggle":
      return false;
    case "strings":
    case "images":
    case "booleans":
    case "list":
      return [];
    case "select":
      return field.optional ? "" : (field.options[0]?.value ?? "");
    case "object":
      return emptyObject(field.fields);
    default:
      return "";
  }
}

function emptyObject(fields: Fields) {
  return Object.fromEntries(
    Object.entries(fields).map(([k, f]) => [k, emptyFor(f)]),
  );
}

/**
 * Apply a change to one field of an object (section, group or list item),
 * clearing any select that depends on it if its choice no longer fits.
 */
function setField(fields: Fields, obj: Data, key: string, v: unknown): Data {
  const next: Data = { ...obj, [key]: v };
  for (const [k, f] of Object.entries(fields)) {
    if (f.type !== "select" || f.dependsOn !== key) continue;
    const current = next[k];
    const ok = f.options.some(
      (o) => o.value === current && (!o.group || o.group === v),
    );
    if (current && !ok) next[k] = "";
  }
  return next;
}

/**
 * The editing form for one section, generated from its field specs.
 * `root` is the whole section's data (some fields read sibling values).
 */
export function SectionForm({
  fields,
  value,
  onChange,
  errors,
}: {
  fields: Fields;
  value: Data;
  onChange: (value: Data) => void;
  errors: Errors;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-5">
      {Object.entries(fields).map(([key, field]) => (
        <FieldInput
          key={key}
          field={field}
          path={key}
          value={value[key]}
          root={value}
          siblings={value}
          errors={errors}
          onChange={(v) => onChange(setField(fields, value, key, v))}
        />
      ))}
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
  path,
  root,
  siblings,
  errors,
}: {
  field: Field;
  value: unknown;
  onChange: (v: unknown) => void;
  path: string;
  root: Data;
  /** The other fields of the same object or list item. */
  siblings: Data;
  errors: Errors;
}) {
  const error = errors[path];
  const str =
    typeof value === "string" ? value : value == null ? "" : String(value);
  const optional = field.optional ? " (optional)" : "";

  switch (field.type) {
    case "text":
      return (
        <TextField
          label={field.label + optional}
          hint={field.hint}
          error={error}
          maxLength={field.max}
          placeholder={field.placeholder}
          value={str}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "url":
      return (
        <TextField
          label={field.label + optional}
          hint={
            field.hint ?? "A page on this site (/works) or a full web address."
          }
          error={error}
          placeholder="/contact"
          value={str}
          onChange={(e) => onChange(e.target.value.trim())}
        />
      );
    case "textarea":
      return (
        <TextareaField
          label={field.label + optional}
          hint={field.hint}
          error={error}
          maxLength={field.max}
          rows={field.rows ?? 3}
          value={str}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "accent":
      return field.multiline ? (
        <TextareaField
          label={field.label + optional}
          hint={field.hint ?? ACCENT_HINT}
          error={error}
          maxLength={field.max}
          rows={3}
          value={str}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <TextField
          label={field.label + optional}
          hint={field.hint ?? ACCENT_HINT}
          error={error}
          maxLength={field.max}
          value={str}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "media":
      return (
        <MediaValueField
          label={field.label + optional}
          hint={field.hint}
          error={error}
          optional={field.optional}
          kind={field.kinds?.[0] ?? "IMAGE"}
          value={str}
          onChange={onChange}
        />
      );
    case "number":
      return (
        <NumberField
          label={field.label}
          hint={field.hint}
          error={error}
          min={field.min}
          max={field.max}
          step={field.step}
          value={typeof value === "number" ? value : null}
          onChange={(v) => onChange(v ?? 0)}
        />
      );
    case "toggle":
      return (
        <SwitchField
          label={field.label}
          description={field.description ?? field.hint}
          checked={!!value}
          onCheckedChange={onChange}
        />
      );
    case "select":
      return (
        <SelectField
          label={field.label + optional}
          hint={field.hint}
          error={error}
          value={str}
          onChange={(e) => onChange(e.target.value)}
          options={[
            // "None" unless the list has its own empty choice.
            ...(field.optional && !field.options.some((o) => o.value === "")
              ? [{ value: "", label: "None" }]
              : []),
            ...field.options.filter(
              (o) =>
                !field.dependsOn ||
                !o.group ||
                o.group === siblings[field.dependsOn],
            ),
            // Keep a saved value that's no longer in the list visible.
            ...(str && !field.options.some((o) => o.value === str)
              ? [{ value: str, label: `${str} (no longer in the list)` }]
              : []),
          ]}
        />
      );
    case "strings":
      return (
        <ListEditor
          label={field.label + optional}
          hint={error ?? field.hint}
          addLabel={field.addLabel ?? "Add"}
          max={field.max}
          value={Array.isArray(value) ? (value as string[]) : []}
          onChange={onChange}
        />
      );
    case "images":
      return (
        <ImagesInput
          field={field}
          value={value}
          onChange={onChange}
          error={error}
        />
      );
    case "booleans": {
      const labels = Array.isArray(root[field.labelsFrom])
        ? (root[field.labelsFrom] as string[])
        : [];
      const list = Array.isArray(value) ? (value as boolean[]) : [];
      return (
        <fieldset className="flex min-w-0 flex-col gap-2">
          <legend className="mb-1.5 text-sm font-bold">{field.label}</legend>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {labels.map((l, i) => (
              <CheckboxField
                key={`${l}-${i}`}
                label={l || `Column ${i + 1}`}
                checked={!!list[i]}
                onCheckedChange={(on) => {
                  const next = labels.map((_, j) => (j === i ? on : !!list[j]));
                  onChange(next);
                }}
              />
            ))}
          </div>
        </fieldset>
      );
    }
    case "object":
      return (
        <fieldset className="border-surface-rule flex min-w-0 flex-col gap-4 rounded-[10px] border bg-white/60 p-4">
          <legend className="px-1 text-sm font-bold">{field.label}</legend>
          {field.hint && (
            <p className="text-surface-muted -mt-2 text-xs">{field.hint}</p>
          )}
          {Object.entries(field.fields).map(([k, sub]) => (
            <FieldInput
              key={k}
              field={sub}
              path={`${path}.${k}`}
              value={(value as Data | undefined)?.[k]}
              root={root}
              siblings={(value as Data) ?? {}}
              errors={errors}
              onChange={(v) =>
                onChange(setField(field.fields, (value as Data) ?? {}, k, v))
              }
            />
          ))}
        </fieldset>
      );
    case "list":
      return (
        <ListInput
          field={field}
          value={value}
          onChange={onChange}
          path={path}
          root={root}
          errors={errors}
        />
      );
  }
}

/** A gallery field for any form (not only page sections). */
export function GalleryField({
  label,
  value,
  onChange,
  max = 30,
  videos = false,
  hint,
  error,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  max?: number;
  videos?: boolean;
  hint?: string;
  error?: string;
}) {
  return (
    <ImagesInput
      field={{ type: "images", label, max, videos, hint }}
      value={value}
      onChange={(v) => onChange(v as string[])}
      error={error}
    />
  );
}

/**
 * A gallery: add several files at once from the media library, replace or
 * remove any of them, and move them left or right. The first one is usually
 * the cover.
 */
function ImagesInput({
  field,
  value,
  onChange,
  error,
}: {
  field: Extract<Field, { type: "images" }>;
  value: unknown;
  onChange: (v: unknown) => void;
  error?: string;
}) {
  const list = Array.isArray(value) ? (value as string[]) : [];
  const max = field.max ?? 60;
  const [adding, setAdding] = useState(false);
  const [replacing, setReplacing] = useState<number | null>(null);
  const kinds: ("IMAGE" | "VIDEO")[] = field.videos
    ? ["IMAGE", "VIDEO"]
    : ["IMAGE"];
  const noun = field.videos ? "media" : "image";
  const valueOf = (a: MediaAssetDTO) =>
    a.kind === "VIDEO" ? a.url : mediaValue(a);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= list.length) return;
    const next = [...list];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    onChange(next);
  };

  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-1.5 flex w-full items-baseline justify-between gap-3 text-sm font-bold">
        {field.label}
        <span className="text-surface-muted text-xs font-normal">
          {list.length} of {max}
        </span>
      </legend>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {list.map((item, i) => {
          const video = isVideoSource(item);
          return (
            <li
              key={`${item}-${i}`}
              className="overflow-hidden rounded-[10px] bg-white ring-1 ring-black/[0.08]"
            >
              <button
                type="button"
                onClick={() => setReplacing(i)}
                aria-label={`Replace ${noun} ${i + 1}`}
                className="bg-canvas relative block aspect-[4/3] w-full overflow-hidden outline-none focus-visible:shadow-[inset_0_0_0_3px_rgb(0_171_255/0.5)]"
              >
                {video ? (
                  <video
                    src={item}
                    muted
                    playsInline
                    preload="metadata"
                    className="size-full object-cover"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- previews from any host
                  <img
                    src={stock(item, 360)}
                    alt=""
                    loading="lazy"
                    className="size-full object-cover"
                  />
                )}
                {video && (
                  <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-[0.6875rem] font-bold text-white">
                    <Film aria-hidden className="size-3" /> Video
                  </span>
                )}
                {i === 0 && (
                  <span className="bg-royal absolute top-1.5 left-1.5 rounded-full px-2 py-0.5 text-[0.6875rem] font-bold text-white">
                    Cover
                  </span>
                )}
              </button>
              <div className="flex items-center justify-between px-1 py-0.5">
                <span className="flex">
                  <IconButton
                    size="sm"
                    label={`Move ${noun} ${i + 1} earlier`}
                    icon={<ChevronLeft />}
                    disabled={i === 0}
                    onClick={() => move(i, i - 1)}
                  />
                  <IconButton
                    size="sm"
                    label={`Move ${noun} ${i + 1} later`}
                    icon={<ChevronRight />}
                    disabled={i === list.length - 1}
                    onClick={() => move(i, i + 1)}
                  />
                </span>
                <IconButton
                  size="sm"
                  tone="danger"
                  label={`Remove ${noun} ${i + 1}`}
                  icon={<Trash2 />}
                  onClick={() => onChange(list.filter((_, j) => j !== i))}
                />
              </div>
            </li>
          );
        })}
        {list.length < max && (
          <li>
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="text-royal hover:bg-ice border-charcoal/[0.18] flex aspect-[4/3] w-full flex-col items-center justify-center gap-1.5 rounded-[10px] border-2 border-dashed bg-white text-sm font-bold outline-none focus-visible:shadow-[0_0_0_3px_rgb(0_171_255/0.35)]"
            >
              <Plus aria-hidden className="size-5" />
              {field.videos ? "Add images or videos" : "Add images"}
            </button>
          </li>
        )}
      </ul>
      {(error || field.hint) && (
        <p
          className={cn(
            "text-xs",
            error ? "font-bold text-[#c2410c]" : "text-surface-muted",
          )}
        >
          {error ?? field.hint}
        </p>
      )}
      <MediaPickerDialog
        open={adding}
        onOpenChange={setAdding}
        kinds={kinds}
        multiple
        onSelect={(assets) =>
          onChange([...list, ...assets.map(valueOf)].slice(0, max))
        }
      />
      <MediaPickerDialog
        open={replacing !== null}
        onOpenChange={(o) => !o && setReplacing(null)}
        kinds={kinds}
        title={`Replace ${noun}`}
        onSelect={(assets) => {
          const a = assets[0];
          if (a && replacing !== null)
            onChange(list.map((x, j) => (j === replacing ? valueOf(a) : x)));
          setReplacing(null);
        }}
      />
    </fieldset>
  );
}

function ListInput({
  field,
  value,
  onChange,
  path,
  root,
  errors,
}: {
  field: Extract<Field, { type: "list" }>;
  value: unknown;
  onChange: (v: unknown) => void;
  path: string;
  root: Data;
  errors: Errors;
}) {
  const items = Array.isArray(value) ? (value as Data[]) : [];
  const [open, setOpen] = useState<number | null>(items.length <= 1 ? 0 : null);
  const max = field.max ?? 200;
  const titleKey = field.titleKey ?? Object.keys(field.fields)[0];
  const hasError = (i: number) =>
    Object.keys(errors).some((k) => k.startsWith(`${path}.${i}.`));

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    onChange(next);
    setOpen(to);
  };

  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-1.5 flex w-full items-baseline justify-between gap-3 text-sm font-bold">
        {field.label}
        <span className="text-surface-muted text-xs font-normal">
          {items.length}
          {field.max ? ` of ${field.max}` : ""}
        </span>
      </legend>
      {field.hint && (
        <p className="text-surface-muted -mt-1 text-xs">{field.hint}</p>
      )}
      <ol className="flex flex-col gap-2">
        {items.map((item, i) => {
          const raw = item?.[titleKey];
          const title =
            (typeof raw === "string" && raw.replace(/\*/g, "").trim()) ||
            `${field.itemLabel} ${i + 1}`;
          const isOpen = open === i;
          return (
            <li
              key={i}
              className={cn(
                "overflow-hidden rounded-[10px] bg-white ring-1",
                hasError(i) ? "ring-[#c2410c]" : "ring-black/[0.08]",
              )}
            >
              <div className="flex items-center gap-1 py-1 pr-1 pl-3">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left text-sm font-bold outline-none focus-visible:underline"
                >
                  <span className="text-surface-muted w-5 shrink-0 text-xs tabular-nums">
                    {i + 1}
                  </span>
                  <span className="truncate">{title}</span>
                </button>
                <IconButton
                  size="sm"
                  label={`Move ${title} up`}
                  icon={<ChevronUp />}
                  disabled={i === 0}
                  onClick={() => move(i, i - 1)}
                />
                <IconButton
                  size="sm"
                  label={`Move ${title} down`}
                  icon={<ChevronDown />}
                  disabled={i === items.length - 1}
                  onClick={() => move(i, i + 1)}
                />
                <IconButton
                  size="sm"
                  label={`Duplicate ${title}`}
                  icon={<Copy />}
                  disabled={items.length >= max}
                  onClick={() => {
                    const next = [...items];
                    next.splice(i + 1, 0, globalThis.structuredClone(item));
                    onChange(next);
                    setOpen(i + 1);
                  }}
                />
                <IconButton
                  size="sm"
                  tone="danger"
                  label={`Remove ${title}`}
                  icon={<Trash2 />}
                  onClick={() => {
                    onChange(items.filter((_, j) => j !== i));
                    setOpen(null);
                  }}
                />
              </div>
              {isOpen && (
                <div className="border-surface-rule flex flex-col gap-4 border-t p-4">
                  {Object.entries(field.fields).map(([k, sub]) => (
                    <FieldInput
                      key={k}
                      field={sub}
                      path={`${path}.${i}.${k}`}
                      value={item?.[k]}
                      root={root}
                      siblings={item ?? {}}
                      errors={errors}
                      onChange={(v) =>
                        onChange(
                          items.map((it, j) =>
                            j === i
                              ? setField(field.fields, it ?? {}, k, v)
                              : it,
                          ),
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <button
        type="button"
        disabled={items.length >= max}
        onClick={() => {
          onChange([...items, emptyObject(field.fields)]);
          setOpen(items.length);
        }}
        className="text-royal hover:bg-ice border-charcoal/[0.18] inline-flex h-11 items-center justify-center gap-1.5 rounded-[8px] border border-dashed text-sm font-bold disabled:opacity-40"
      >
        <Plus aria-hidden className="size-4" /> Add{" "}
        {field.itemLabel.toLowerCase()}
      </button>
    </fieldset>
  );
}
