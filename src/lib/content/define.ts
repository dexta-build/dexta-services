import type { AdminArea } from "@/lib/admin/permissions";
import { f, type Fields } from "./fields";

/**
 * A section of a page: what's editable (fields), what it says until
 * someone edits it (defaults), and how it's labelled in the admin.
 * `defaults` may be async to read from an older table on first use.
 */
export type SectionDef<K extends string = string, T = unknown> = {
  key: K;
  label: string;
  description?: string;
  fields: Fields;
  defaults: T | (() => Promise<T>);
  /** Whether the section can be hidden from the page (default true). */
  canHide?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- sections hold different data shapes
export type AnySections = readonly SectionDef<string, any>[];

export function section<const K extends string, T>(def: SectionDef<K, T>) {
  return def;
}

export type PageGroup = "Pages" | "Page templates" | "Services" | "Site-wide";

export type PageDef<
  S extends readonly SectionDef<string, unknown>[] = readonly SectionDef<
    string,
    unknown
  >[],
> = {
  /** Unique key, e.g. "home", "service.design.brand-identity". */
  key: string;
  label: string;
  /** Public address, or null for site-wide settings. */
  path: string | null;
  area: AdminArea;
  group: PageGroup;
  description?: string;
  sections: S;
};

export function page<const S extends AnySections>(def: PageDef<S>) {
  return def;
}

/** The data of every section in a page, keyed by section key. */
export type PageData<P extends PageDef<AnySections>> = {
  [D in P["sections"][number] as D["key"]]: D extends SectionDef<
    string,
    infer T
  >
    ? T
    : never;
};

/* ── Search & sharing (every page gets one) ─────────────────────────────── */

export type SeoData = {
  title: string;
  description: string;
  image: string;
  noIndex: boolean;
};

export const seoFields: Fields = {
  title: f.text("Search title", {
    max: 70,
    hint: "Shown in Google results and the browser tab. About 50–60 characters.",
  }),
  description: f.textarea("Search description", {
    max: 200,
    rows: 3,
    hint: "The summary under the title in search results. About 150–160 characters.",
  }),
  image: f.image("Share image", {
    optional: true,
    hint: "Shown when the page is shared on WhatsApp, LinkedIn, X and others. 1200 × 630 works best. Leave empty to use the site default.",
  }),
  noIndex: f.toggle("Hide from search engines", {
    description: "Asks Google and others not to list this page.",
  }),
};

type SeoDefaults = Partial<SeoData> & { title: string; description: string };

/** `defaults` may be a function, to start from text kept elsewhere. */
export function seoSection(
  defaults: SeoDefaults | (() => Promise<SeoDefaults>),
) {
  const fill = (d: SeoDefaults): SeoData => ({
    image: "",
    noIndex: false,
    ...d,
  });
  return section({
    key: "seo",
    label: "Search & sharing",
    description: "How the page appears in Google and when shared.",
    fields: seoFields,
    canHide: false,
    defaults:
      typeof defaults === "function"
        ? async () => fill(await defaults())
        : fill(defaults),
  });
}

/** Envelope stored in PageSection.draft / .published. */
export type SectionEnvelope<T = unknown> = { data: T; hidden: boolean };
