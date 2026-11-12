import { z } from "zod";

/**
 * Event registration form fields: shared by the event builder, the public
 * form and the server, so all three agree. Safe on server and client.
 * Name and email are always asked first and aren't stored as fields.
 */

export type FieldType =
  | "TEXT"
  | "EMAIL"
  | "SELECT"
  | "TEXTAREA"
  | "URL"
  | "CHECKBOX";

export const FIELD_TYPES: { value: FieldType; label: string; hint: string }[] =
  [
    { value: "TEXT", label: "Short answer", hint: "One line of text" },
    { value: "TEXTAREA", label: "Long answer", hint: "A few sentences" },
    { value: "SELECT", label: "Dropdown", hint: "Pick one from a list" },
    {
      value: "CHECKBOX",
      label: "Tick box",
      hint: "Yes or no, or an agreement",
    },
    { value: "EMAIL", label: "Email address", hint: "Another email" },
    { value: "URL", label: "Link", hint: "A web address" },
  ];

export type FormFieldDef = {
  /** Answer key, e.g. "tech_stack". Kept when the label changes. */
  name: string;
  label: string;
  type: FieldType;
  /** Placeholder, or the sentence beside a tick box. */
  placeholder: string;
  required: boolean;
  /** Choices for a dropdown. */
  options: string[];
};

/** Keys the form uses itself, so fields can't take them. */
export const RESERVED_KEYS = [
  "name",
  "email",
  "recaptchaToken",
  "hp_company_website",
  "_form_ts",
];

export function fieldKey(label: string, taken: string[]) {
  const base =
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "field";
  let key = base;
  for (let n = 2; taken.includes(key) || RESERVED_KEYS.includes(key); n++)
    key = `${base}_${n}`;
  return key;
}

/** The stored JSON (or null) as a list of choices. */
export function parseOptions(raw: string | null | undefined): string[] {
  try {
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v)
      ? v.filter((o): o is string => typeof o === "string" && !!o.trim())
      : [];
  } catch {
    return [];
  }
}

const URL_RE = /^https?:\/\/[^\s.]+\.[^\s]+$/i;

/**
 * Checks a submission (all values are strings; a ticked box is "yes").
 * Returns clean answers or a message per field, using the field labels.
 */
export function checkRegistration(
  fields: FormFieldDef[],
  input: Record<string, string | undefined>,
):
  | {
      ok: true;
      name: string;
      email: string;
      answers: Record<string, string | boolean>;
    }
  | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const name = (input.name ?? "").trim();
  const email = (input.email ?? "").trim().toLowerCase();
  if (name.length < 2) errors.name = "Please enter your name.";
  if (name.length > 120) errors.name = "That name is too long.";
  if (!z.email().safeParse(email).success)
    errors.email = "Please enter a valid email address.";

  const answers: Record<string, string | boolean> = {};
  for (const f of fields) {
    const raw = (input[f.name] ?? "").trim();
    if (f.type === "CHECKBOX") {
      const ticked = raw === "yes" || raw === "true";
      if (f.required && !ticked) errors[f.name] = "Please tick this box.";
      answers[f.name] = ticked;
      continue;
    }
    if (!raw) {
      if (f.required)
        errors[f.name] =
          f.type === "SELECT" ? "Please choose one." : "Please fill this in.";
      answers[f.name] = "";
      continue;
    }
    if (raw.length > (f.type === "TEXTAREA" ? 4000 : 500)) {
      errors[f.name] = "That's too long.";
      continue;
    }
    if (f.type === "EMAIL" && !z.email().safeParse(raw).success)
      errors[f.name] = "Please enter a valid email address.";
    else if (f.type === "URL" && !URL_RE.test(raw))
      errors[f.name] = "Please enter a full web address (https://…).";
    else if (
      f.type === "SELECT" &&
      f.options.length &&
      !f.options.includes(raw)
    )
      errors[f.name] = "Please choose one of the options.";
    answers[f.name] = raw;
  }
  return Object.keys(errors).length
    ? { ok: false, errors }
    : { ok: true, name, email, answers };
}

/** A stored answer as text (older forms stored ticks as true/false). */
export function answerText(value: unknown): string {
  if (value === true || value === "true") return "Yes";
  if (value === false || value === "false") return "No";
  if (value == null) return "";
  return String(value);
}
