import "server-only";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import type { Surface } from "@/components/site/section";
import { EXPRESSION_DEFAULTS } from "./expressions-content";
import { imageUrl } from "./media";
import { renderArticle } from "./thoughts-data";

/**
 * "Our Expressions" (products built by Dexta) from the Expression table,
 * falling back to the built-in products while the table is empty. Cached
 * on the admin's existing "expressions-content" tag; no polling.
 */

const SURFACES: Surface[] = [
  "brand",
  "royal",
  "forest",
  "gold",
  "plum",
  "ocean",
  "lilac",
  "mint",
  "coral",
  "ice",
];

export type Expression = {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  description: string;
  websiteUrl: string;
  /** Hostname for display, e.g. bookprinta.com */
  host: string;
  surface: Surface;
  logo: string | null;
  /** Square icon for logo strips: the admin logo, else the built-in icon. */
  icon: string | null;
  cover: string;
  mobile: string | null;
  features: string[];
  facts: { value: string; label: string }[];
  story: string;
};

function toSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function safeUrl(url: string) {
  try {
    const u = new URL(/^https?:\/\//.test(url) ? url : `https://${url}`);
    return u.protocol === "https:" || u.protocol === "http:"
      ? u.toString()
      : "#";
  } catch {
    return "#";
  }
}

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function surface(color: string | null | undefined, i: number): Surface {
  return SURFACES.includes(color as Surface)
    ? (color as Surface)
    : SURFACES[i % SURFACES.length];
}

function defaults(): Expression[] {
  return EXPRESSION_DEFAULTS.map((e, i) => ({
    ...e,
    websiteUrl: safeUrl(e.websiteUrl),
    host: hostOf(e.websiteUrl),
    surface: surface(e.color, i),
    logo: null,
    icon: e.icon,
  }));
}

async function readExpressions(): Promise<Expression[]> {
  try {
    const rows = await prisma.expression.findMany({
      where: { isVisible: true },
      orderBy: { position: "asc" },
    });
    if (rows.length === 0) return defaults();
    return rows.map((r, i) => {
      const fallback = EXPRESSION_DEFAULTS.find(
        (d) => hostOf(d.websiteUrl) === hostOf(r.websiteUrl),
      );
      const cover = r.coverPublicId
        ? imageUrl(r.coverPublicId, 1600)
        : (fallback?.cover ?? "/expressions/school-portal-desktop.webp");
      return {
        slug: r.slug || toSlug(r.name),
        name: r.name,
        tagline: r.tagline || fallback?.tagline || r.name,
        category: r.category || fallback?.category || "Product",
        description: r.description,
        websiteUrl: safeUrl(r.websiteUrl),
        host: hostOf(r.websiteUrl),
        surface: surface(r.color ?? fallback?.color, i),
        logo: r.logoPublicId ? imageUrl(r.logoPublicId, 160) : null,
        icon: r.logoPublicId
          ? imageUrl(r.logoPublicId, 160)
          : (fallback?.icon ?? null),
        cover,
        mobile: r.mobilePublicId
          ? imageUrl(r.mobilePublicId, 780)
          : (fallback?.mobile ?? null),
        features: parseJson<string[]>(r.features, fallback?.features ?? []),
        facts: parseJson(r.facts, fallback?.facts ?? []),
        story: r.story || fallback?.story || `<p>${r.description}</p>`,
      };
    });
  } catch {
    // New columns not pushed yet, or no database: use the built-in list.
    return defaults();
  }
}

const readExpressionsCached = unstable_cache(
  readExpressions,
  ["site-expressions"],
  { revalidate: false, tags: ["expressions-content"] },
);

export async function getExpressions(): Promise<Expression[]> {
  return process.env.NODE_ENV === "development"
    ? readExpressions()
    : readExpressionsCached();
}

export async function getExpression(slug: string) {
  const all = await getExpressions();
  const index = all.findIndex((e) => e.slug === slug);
  if (index < 0) return null;
  const expression = all[index];
  const { html, toc } = renderArticle(expression.story);
  return {
    expression,
    html,
    toc,
    next: all.length > 1 ? all[(index + 1) % all.length] : null,
  };
}
