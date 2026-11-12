import { z } from "zod";

/**
 * Field specs describe what's editable in a section. One spec gives both
 * the admin form (rendered automatically) and the validation. Shared by
 * server and browser, so it must stay plain data.
 *
 * Values not covered by a spec (e.g. colour classes) are kept as they are.
 */

type Base = {
  label: string;
  hint?: string;
  /** May be left empty. */
  optional?: boolean;
};

export type Field =
  | (Base & { type: "text"; max?: number; placeholder?: string })
  | (Base & { type: "textarea"; max?: number; rows?: number })
  /** Text where *words in asterisks* show in the serif italic accent. */
  | (Base & { type: "accent"; max?: number; multiline?: boolean })
  /** A page path (/works) or full web address. */
  | (Base & { type: "url" })
  /** Image (or video) from the media library, a site path or a URL. */
  | (Base & { type: "media"; kinds?: ("IMAGE" | "VIDEO" | "DOCUMENT")[] })
  | (Base & { type: "number"; min?: number; max?: number; step?: number })
  | (Base & { type: "toggle"; description?: string })
  | (Base & {
      type: "select";
      /** `group` ties an option to a value of the `dependsOn` field. */
      options: { value: string; label: string; group?: string }[];
      /**
       * Name of a sibling field. Only options whose `group` matches its
       * value are offered, and the choice is cleared when it changes.
       */
      dependsOn?: string;
      /** Fill the choices from a shared list at edit time (see content/admin.ts). */
      optionsFrom?: "occasions" | "services";
    })
  /** Several images (a gallery or a rotating set). */
  | (Base & { type: "images"; max?: number; videos?: boolean })
  /** Yes/no per item, labelled by a list field at the top of the section. */
  | (Base & { type: "booleans"; labelsFrom: string })
  /** A list of short texts. */
  | (Base & { type: "strings"; addLabel?: string; max?: number })
  /** A group of fields. */
  | (Base & { type: "object"; fields: Fields })
  /** A repeatable list of items with the same fields. */
  | (Base & {
      type: "list";
      fields: Fields;
      /** What one item is called ("Step", "Question"). */
      itemLabel: string;
      /** Field shown as each item's title in the list. */
      titleKey?: string;
      max?: number;
    });

export type Fields = Record<string, Field>;

/* Builders keep registry files short and readable. */
export const f = {
  text: (
    label: string,
    o: Omit<Extract<Field, { type: "text" }>, "type" | "label"> = {},
  ) => ({ type: "text", label, ...o }) as Field,
  textarea: (
    label: string,
    o: Omit<Extract<Field, { type: "textarea" }>, "type" | "label"> = {},
  ) => ({ type: "textarea", label, ...o }) as Field,
  accent: (
    label: string,
    o: Omit<Extract<Field, { type: "accent" }>, "type" | "label"> = {},
  ) => ({ type: "accent", label, ...o }) as Field,
  url: (
    label: string,
    o: Omit<Extract<Field, { type: "url" }>, "type" | "label"> = {},
  ) => ({ type: "url", label, ...o }) as Field,
  image: (
    label: string,
    o: Omit<Extract<Field, { type: "media" }>, "type" | "label"> = {},
  ) => ({ type: "media", label, kinds: ["IMAGE"], ...o }) as Field,
  video: (
    label: string,
    o: Omit<Extract<Field, { type: "media" }>, "type" | "label"> = {},
  ) => ({ type: "media", label, kinds: ["VIDEO"], ...o }) as Field,
  images: (
    label: string,
    o: Omit<Extract<Field, { type: "images" }>, "type" | "label"> = {},
  ) => ({ type: "images", label, ...o }) as Field,
  booleans: (label: string, labelsFrom: string, o: Omit<Base, "label"> = {}) =>
    ({ type: "booleans", label, labelsFrom, ...o }) as Field,
  number: (
    label: string,
    o: Omit<Extract<Field, { type: "number" }>, "type" | "label"> = {},
  ) => ({ type: "number", label, ...o }) as Field,
  toggle: (
    label: string,
    o: Omit<Extract<Field, { type: "toggle" }>, "type" | "label"> = {},
  ) => ({ type: "toggle", label, ...o }) as Field,
  select: (
    label: string,
    options: { value: string; label: string; group?: string }[],
    o: Omit<
      Extract<Field, { type: "select" }>,
      "type" | "label" | "options"
    > = {},
  ) => ({ type: "select", label, options, ...o }) as Field,
  strings: (
    label: string,
    o: Omit<Extract<Field, { type: "strings" }>, "type" | "label"> = {},
  ) => ({ type: "strings", label, ...o }) as Field,
  object: (label: string, fields: Fields, o: Omit<Base, "label"> = {}) =>
    ({ type: "object", label, fields, ...o }) as Field,
  list: (
    label: string,
    itemLabel: string,
    fields: Fields,
    o: Omit<
      Extract<Field, { type: "list" }>,
      "type" | "label" | "itemLabel" | "fields"
    > = {},
  ) => ({ type: "list", label, itemLabel, fields, ...o }) as Field,
  /** Button / link: label + where it goes. */
  link: (label: string, o: Omit<Base, "label"> = {}) =>
    ({
      type: "object",
      label,
      fields: {
        label: { type: "text", label: "Button text", max: 60 },
        href: { type: "url", label: "Goes to" },
      },
      ...o,
    }) as Field,
  /** Small label above a heading. */
  eyebrow: () =>
    ({
      type: "text",
      label: "Eyebrow",
      hint: "The small label above the heading.",
      max: 60,
      optional: true,
    }) as Field,
  /** Section heading with serif accent. */
  heading: (label = "Heading") =>
    ({
      type: "accent",
      label,
      max: 160,
      hint: "Wrap words in *asterisks* for the serif italic accent.",
    }) as Field,
};

/* ── Validation ─────────────────────────────────────────────────────────── */

function fieldSchema(field: Field): z.ZodType {
  let s: z.ZodType;
  switch (field.type) {
    case "text":
    case "textarea":
    case "accent":
      s = field.max ? z.string().max(field.max * 2) : z.string().max(20000);
      break;
    case "url":
    case "media":
      s = z.string().max(2000);
      break;
    case "number":
      s = z.number();
      break;
    case "toggle":
      s = z.boolean();
      break;
    case "select":
      s = z.string();
      break;
    case "strings":
      s = z.array(z.string().max(2000)).max(field.max ?? 200);
      break;
    case "images":
      s = z.array(z.string().max(2000)).max(field.max ?? 60);
      break;
    case "booleans":
      s = z.array(z.boolean()).max(50);
      break;
    case "object":
      s = objectSchema(field.fields);
      break;
    case "list":
      s = z.array(objectSchema(field.fields)).max(field.max ?? 200);
      break;
  }
  // Optional fields may be empty or missing; required text must not be blank.
  if (field.optional) return s.optional().nullable();
  if (
    field.type === "text" ||
    field.type === "accent" ||
    field.type === "textarea"
  ) {
    return (s as z.ZodString).trim().min(1, `${field.label} can't be empty.`);
  }
  return s;
}

export function objectSchema(fields: Fields) {
  const shape: Record<string, z.ZodType> = {};
  for (const [k, v] of Object.entries(fields)) shape[k] = fieldSchema(v);
  // Keep values the form doesn't edit (colours, icons, ids).
  return z.looseObject(shape);
}

/* ── Merging saved data over defaults ───────────────────────────────────── */

const isPlain = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

/**
 * Saved content wins; anything it lacks (e.g. a field added after it was
 * saved) comes from the defaults. Lists are replaced as a whole.
 */
export function mergeOver<T>(defaults: T, saved: unknown): T {
  if (!isPlain(defaults) || !isPlain(saved))
    return (saved === undefined ? defaults : saved) as T;
  const out: Record<string, unknown> = { ...defaults };
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) continue;
    out[k] = isPlain(defaults[k]) && isPlain(v) ? mergeOver(defaults[k], v) : v;
  }
  return out as T;
}
