import { z } from "zod";

/** Shared by the reset, invite and account forms (client and server). */
export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(128, "Use 128 characters or fewer.")
  .refine((p) => /[A-Za-z]/.test(p) && /[0-9\W_]/.test(p), {
    message: "Mix letters with numbers or symbols.",
  });

export const PASSWORD_HINT =
  "At least 10 characters, with letters and a number or symbol.";
