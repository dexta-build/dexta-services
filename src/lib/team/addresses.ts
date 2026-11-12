import { DETECTED_SITE_PAGES } from "./site-pages.generated";

/**
 * Team profiles live at the top level of the site (/daniel-azu), so an
 * address must never be one the site uses itself. Safe on server and
 * client (the editor checks as you type).
 *
 * The site's own addresses are found automatically: before `pnpm dev` and
 * `pnpm build`, scripts/generate-site-pages.mjs scans src/app, public/ and
 * next.config.ts and writes site-pages.generated.ts. Adding a page needs no
 * change here.
 */

/** Every top-level page, folder and redirect the site has right now. */
export const SITE_PAGES: readonly string[] = DETECTED_SITE_PAGES;

/** Words kept free for pages the site may add later. */
const FUTURE = [
  "account",
  "assets",
  "blog",
  "careers",
  "cart",
  "checkout",
  "cookies",
  "dashboard",
  "embed",
  "faq",
  "favicon",
  "feed",
  "help",
  "home",
  "index",
  "jobs",
  "legal",
  "login",
  "logout",
  "news",
  "portfolio",
  "preview",
  "pricing",
  "privacy",
  "profile",
  "public",
  "register",
  "rss",
  "search",
  "settings",
  "shop",
  "signin",
  "signup",
  "static",
  "store",
  "support",
  "terms",
  "user",
  "users",
  "www",
];

export const RESERVED_ADDRESSES = new Set<string>([...SITE_PAGES, ...FUTURE]);

/**
 * The address the site gives someone without one saved: their name in
 * lower case with dashes ("Daniel Azu" → "daniel-azu"). The public pages,
 * the editor and the save action all use this, so they always agree.
 */
export function defaultAddress(name: string) {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Someone's current address: the saved one, else the one from their name. */
export function liveAddress(saved: string | null | undefined, name: string) {
  return saved?.trim() || defaultAddress(name);
}

/** What the editor sends, cleaned into an address. */
export function cleanAddress(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Lower-case letters and numbers, single dashes between words. */
export const ADDRESS_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type AddressProblem =
  | { kind: "empty" }
  | { kind: "format" }
  | { kind: "reserved" }
  | { kind: "taken"; by: string };

/**
 * Why an address can't be used, or null if it's fine. `taken` lists other
 * people's current addresses (address → name).
 */
export function addressProblem(
  address: string,
  taken: Record<string, string>,
): AddressProblem | null {
  if (!address) return { kind: "empty" };
  if (address.length > 60 || !ADDRESS_PATTERN.test(address))
    return { kind: "format" };
  if (RESERVED_ADDRESSES.has(address) || /^dexta-academy/.test(address))
    return { kind: "reserved" };
  if (taken[address]) return { kind: "taken", by: taken[address] };
  return null;
}

export function describeProblem(p: AddressProblem) {
  switch (p.kind) {
    case "empty":
      return "Give the profile an address.";
    case "format":
      return "Use lower-case letters, numbers and single dashes, e.g. daniel-azu.";
    case "reserved":
      return "That address is used by a page of the site. Try adding a surname or initial.";
    case "taken":
      return `${p.by} already uses this address.`;
  }
}
