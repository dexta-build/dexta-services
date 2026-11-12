import "server-only";
import { unstable_cache } from "next/cache";
import sanitizeHtml from "sanitize-html";
import prisma from "@/lib/prisma";
import { isPreviewing } from "@/lib/content/store";
import type { Surface } from "@/components/site/section";
import { imageUrl } from "./media";
import { stock } from "./stock-media";
import { SAMPLE_CATEGORIES, SAMPLE_POSTS } from "./thoughts-content";

/**
 * Thoughts (blog) data from the Post / PostCategory tables, with team
 * members as authors. Cached until the admin saves a post (tag below); no
 * polling. In development, sample posts fill in while there are none.
 */

export const THOUGHTS_TAG = "thoughts-content";

const SURFACES: Surface[] = ["ice", "mint", "gold", "lilac", "coral", "stone"];

export type ThoughtCategory = {
  name: string;
  slug: string;
  description: string | null;
  surface: Surface;
};

export type ThoughtAuthor = {
  name: string;
  role: string;
  avatar: string | null;
};

export type ThoughtSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover: string;
  category: ThoughtCategory | null;
  author: ThoughtAuthor | null;
  /** ISO date. */
  publishedAt: string;
  readingMinutes: number;
  featured: boolean;
  tags: string[];
};

export type Thought = ThoughtSummary & {
  /** Sanitised HTML with ids on h2 headings. */
  html: string;
  toc: { id: string; text: string }[];
  seoTitle: string | null;
  seoDescription: string | null;
};

type ThoughtsData = {
  categories: ThoughtCategory[];
  /** Newest first, with raw content for the article view. */
  posts: (ThoughtSummary & {
    content: string;
    seoTitle: string | null;
    seoDescription: string | null;
  })[];
};

/* ---------- helpers ---------- */

function toSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

function readingMinutes(html: string) {
  const words = html
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

function parseTags(raw: string): string[] {
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v)
      ? v.filter((t): t is string => typeof t === "string")
      : [];
  } catch {
    return [];
  }
}

function surfaceFor(color: string | null | undefined, index: number): Surface {
  return SURFACES.includes(color as Surface)
    ? (color as Surface)
    : SURFACES[index % SURFACES.length];
}

const SANITIZE: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "h2",
    "h3",
    "h4",
    "ul",
    "ol",
    "li",
    "blockquote",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "a",
    "img",
    "figure",
    "figcaption",
    "hr",
    "br",
    "code",
    "pre",
    "iframe",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height"],
    iframe: ["src", "title", "allow", "allowfullscreen"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedIframeHostnames: [
    "www.youtube.com",
    "www.youtube-nocookie.com",
    "player.vimeo.com",
  ],
  transformTags: {
    a: (tag, attribs) => {
      const external = /^https?:\/\//.test(attribs.href ?? "");
      return {
        tagName: "a",
        attribs: external
          ? { ...attribs, target: "_blank", rel: "noopener noreferrer" }
          : attribs,
      };
    },
  },
};

/**
 * Cleans article HTML, turns *words* in headings into the serif accent and
 * gives each h2 an id for the table of contents.
 */
export function renderArticle(content: string) {
  const accented = content.replace(
    /<(h[234])([^>]*)>([\s\S]*?)<\/\1>/g,
    (_m, tag: string, attrs: string, inner: string) =>
      `<${tag}${attrs}>${inner.replace(/\*([^*]+)\*/g, "<em>$1</em>")}</${tag}>`,
  );
  const clean = sanitizeHtml(accented, SANITIZE);
  const toc: { id: string; text: string }[] = [];
  const used = new Set<string>();
  const html = clean.replace(/<h2>([\s\S]*?)<\/h2>/g, (_m, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, "").trim();
    let id = toSlug(text) || "section";
    while (used.has(id)) id = `${id}-2`;
    used.add(id);
    toc.push({ id, text });
    return `<h2 id="${id}">${inner}</h2>`;
  });
  return { html, toc };
}

/* ---------- reading ---------- */

const POST_INCLUDE = {
  category: true,
  author: { select: { name: true, role: true, imagePublicId: true } },
} as const;

type PostRow = Awaited<
  ReturnType<typeof prisma.post.findMany<{ include: typeof POST_INCLUDE }>>
>[number];

function toCategories(
  rows: Awaited<ReturnType<typeof prisma.postCategory.findMany>>,
): ThoughtCategory[] {
  return rows.map((c, i) => ({
    name: c.name,
    slug: c.slug,
    description: c.description,
    surface: surfaceFor(c.color, i),
  }));
}

function toPost(
  p: PostRow,
  cats: ThoughtCategory[],
): ThoughtsData["posts"][number] {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    cover: p.coverPublicId
      ? imageUrl(p.coverPublicId, 1600, 1000)
      : stock("1552664730-d307ca884978", 1600, 1000),
    category: p.category
      ? (cats.find((c) => c.slug === p.category!.slug) ?? null)
      : null,
    author: p.author
      ? {
          name: p.author.name,
          role: p.author.role,
          avatar: p.author.imagePublicId
            ? imageUrl(p.author.imagePublicId, 96, 96)
            : null,
        }
      : null,
    publishedAt: (p.publishedAt ?? p.createdAt).toISOString(),
    readingMinutes: readingMinutes(p.content),
    featured: p.isFeatured,
    tags: parseTags(p.tags),
    content: p.content,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
  };
}

async function readFromDb(): Promise<ThoughtsData> {
  const [categories, posts] = await Promise.all([
    prisma.postCategory.findMany({ orderBy: { position: "asc" } }),
    // Scheduled posts are included and hidden until their time (getData).
    prisma.post.findMany({
      where: { status: "PUBLISHED", publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
      include: POST_INCLUDE,
    }),
  ]);
  const cats = toCategories(categories);
  return { categories: cats, posts: posts.map((p) => toPost(p, cats)) };
}

async function readSamples(): Promise<ThoughtsData> {
  // Real team members as sample authors when available.
  let team: ThoughtAuthor[] = [];
  try {
    const rows = await prisma.aboutTeamMember.findMany({
      where: { isVisible: true },
      orderBy: { position: "asc" },
      select: { name: true, role: true, imagePublicId: true },
    });
    team = rows.map((r) => ({
      name: r.name,
      role: r.role,
      avatar: r.imagePublicId ? imageUrl(r.imagePublicId, 96, 96) : null,
    }));
  } catch {
    team = [];
  }
  const cats = SAMPLE_CATEGORIES.map((c, i) => ({
    name: c.name,
    slug: c.slug,
    description: c.description,
    surface: surfaceFor(c.color, i),
  }));
  const day = 86_400_000;
  return {
    categories: cats,
    posts: SAMPLE_POSTS.map((p) => ({
      id: `sample-${p.slug}`,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      cover: stock(p.cover, 1600, 1000),
      category: cats.find((c) => c.slug === p.category) ?? null,
      author: team[p.author] ?? {
        name: "Dexta team",
        role: "Dexta Synergy Services",
        avatar: null,
      },
      publishedAt: new Date(Date.now() - p.daysAgo * day).toISOString(),
      readingMinutes: readingMinutes(p.content),
      featured: Boolean(p.featured),
      tags: p.tags ?? [],
      content: p.content,
      seoTitle: null,
      seoDescription: null,
    })),
  };
}

async function readThoughts(): Promise<ThoughtsData> {
  const dev = process.env.NODE_ENV !== "production";
  try {
    const data = await readFromDb();
    return dev && data.posts.length === 0 ? readSamples() : data;
  } catch {
    // Tables not pushed yet, or no database (e.g. a build without secrets).
    return dev ? readSamples() : { categories: [], posts: [] };
  }
}

const readThoughtsCached = unstable_cache(readThoughts, ["site-thoughts"], {
  revalidate: false,
  tags: [THOUGHTS_TAG],
});

/**
 * Published posts whose time has come. Scheduled posts sit in the cache
 * and appear the moment their date passes, without a refresh timer, on
 * every page that renders per request (all the Thoughts pages do).
 */
async function getData(): Promise<ThoughtsData> {
  const data =
    process.env.NODE_ENV === "development"
      ? await readThoughts()
      : await readThoughtsCached();
  const now = Date.now();
  return {
    ...data,
    posts: data.posts.filter((p) => Date.parse(p.publishedAt) <= now),
  };
}

/** Preview (admin "Preview"): any post by its address, drafts included. */
async function readPreviewPost(slug: string) {
  try {
    const [categories, row] = await Promise.all([
      prisma.postCategory.findMany({ orderBy: { position: "asc" } }),
      prisma.post.findUnique({ where: { slug }, include: POST_INCLUDE }),
    ]);
    return row ? toPost(row, toCategories(categories)) : null;
  } catch {
    return null;
  }
}

function summary(p: ThoughtsData["posts"][number]): ThoughtSummary {
  const { content: _content, seoTitle: _t, seoDescription: _d, ...rest } = p;
  return rest;
}

/** Categories that have at least one post, in admin order. */
export async function getThoughtCategories(): Promise<ThoughtCategory[]> {
  const { categories, posts } = await getData();
  return categories.filter((c) =>
    posts.some((p) => p.category?.slug === c.slug),
  );
}

export async function getThoughts(): Promise<ThoughtSummary[]> {
  const { posts } = await getData();
  return posts.map(summary);
}

export async function getThought(slug: string): Promise<{
  post: Thought;
  related: ThoughtSummary[];
} | null> {
  const { posts } = await getData();
  const found =
    ((await isPreviewing()) ? await readPreviewPost(slug) : null) ??
    posts.find((p) => p.slug === slug);
  if (!found) return null;
  const { html, toc } = renderArticle(found.content);
  const sameCategory = posts.filter(
    (p) => p.slug !== slug && p.category?.slug === found.category?.slug,
  );
  const others = posts.filter(
    (p) => p.slug !== slug && !sameCategory.includes(p),
  );
  return {
    post: {
      ...summary(found),
      html,
      toc,
      seoTitle: found.seoTitle,
      seoDescription: found.seoDescription,
    },
    related: [...sameCategory, ...others].slice(0, 3).map(summary),
  };
}
