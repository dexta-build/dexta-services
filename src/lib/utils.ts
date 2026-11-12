import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge needs to know our custom type-scale utilities are font
 * sizes. Otherwise it treats e.g. `text-eyebrow` as a text colour and drops
 * it whenever a colour class like `text-surface-fg` is also present.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: ["display", "h1", "h2", "h3", "lead", "eyebrow", "stat"],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
