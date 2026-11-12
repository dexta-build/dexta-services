import type { ZodType } from "zod";

/** Checks a form with its schema: the clean data, or one message per field. */
export function checkForm<T>(
  schema: ZodType<T>,
  data: unknown,
):
  | { ok: true; data: T }
  | { ok: false; errors: Record<string, string>; first: string } {
  const parsed = schema.safeParse(data);
  if (parsed.success) return { ok: true, data: parsed.data };
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path.map(String).join(".") || "_";
    if (!errors[key]) errors[key] = issue.message;
  }
  return {
    ok: false,
    errors,
    first: Object.values(errors)[0] ?? "Check the highlighted fields.",
  };
}

export const formatDateTime = (value: Date | string | null | undefined) =>
  value
    ? new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "";

export const formatDate = (value: Date | string | null | undefined) =>
  value
    ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "";
