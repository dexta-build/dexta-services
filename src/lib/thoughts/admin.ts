import "server-only";
import prisma from "@/lib/prisma";
import { SAMPLE_CATEGORIES } from "@/lib/site/thoughts-content";

/** Fills the four starter categories the first time Thoughts opens. */
export async function ensureCategoriesSeeded() {
  try {
    if ((await prisma.postCategory.count()) > 0) return;
    await prisma.postCategory.createMany({
      data: SAMPLE_CATEGORIES.map((c, position) => ({
        name: c.name,
        slug: c.slug,
        description: c.description,
        color: c.color,
        position,
      })),
      skipDuplicates: true,
    });
  } catch (error) {
    console.warn(
      "[thoughts] could not add the starter categories:",
      (error as Error).message,
    );
  }
}

export type PostStatusLabel = "Draft" | "Scheduled" | "Published";

export function statusLabel(
  status: "DRAFT" | "PUBLISHED",
  publishedAt: Date | string | null,
  now = Date.now(),
): PostStatusLabel {
  if (status === "DRAFT") return "Draft";
  return publishedAt && new Date(publishedAt).getTime() > now
    ? "Scheduled"
    : "Published";
}

export type AdminPostRow = {
  id: string;
  title: string;
  slug: string;
  cover: string;
  categoryId: string;
  authorId: string;
  status: "DRAFT" | "PUBLISHED";
  publishedAt: string | null;
  updatedAt: string;
  isFeatured: boolean;
  tags: string[];
};

export type AdminPost = AdminPostRow & {
  excerpt: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
};

export type Option = { id: string; name: string; note?: string };

function parseTags(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((t) => typeof t === "string") : [];
  } catch {
    return [];
  }
}

type Row = Awaited<ReturnType<typeof prisma.post.findMany>>[number];

function toRow(p: Row): AdminPostRow {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    cover: p.coverPublicId ?? "",
    categoryId: p.categoryId ?? "",
    authorId: p.authorId ?? "",
    status: p.status,
    publishedAt: p.publishedAt?.toISOString() ?? null,
    updatedAt: p.updatedAt.toISOString(),
    isFeatured: p.isFeatured,
    tags: parseTags(p.tags),
  };
}

export async function readPostsForAdmin(): Promise<AdminPostRow[]> {
  const rows = await prisma.post.findMany({
    orderBy: [{ updatedAt: "desc" }],
  });
  return rows.map(toRow);
}

export async function readPostForEditor(id: string): Promise<AdminPost | null> {
  const p = await prisma.post.findUnique({ where: { id } });
  if (!p) return null;
  return {
    ...toRow(p),
    excerpt: p.excerpt,
    content: p.content,
    seoTitle: p.seoTitle ?? "",
    seoDescription: p.seoDescription ?? "",
  };
}

export async function readEditorOptions() {
  const [categories, team, tagRows] = await Promise.all([
    prisma.postCategory.findMany({ orderBy: { position: "asc" } }),
    prisma.aboutTeamMember.findMany({
      orderBy: { position: "asc" },
      select: { id: true, name: true, role: true, isVisible: true },
    }),
    prisma.post.findMany({ select: { tags: true } }),
  ]);
  const tags = Array.from(
    new Set(tagRows.flatMap((r) => parseTags(r.tags))),
  ).sort((a, b) => a.localeCompare(b));
  return {
    categories: categories.map((c) => ({ id: c.id, name: c.name })),
    authors: team.map((t) => ({
      id: t.id,
      name: t.name,
      note: t.isVisible ? t.role : `${t.role} (hidden from the team page)`,
    })),
    tags,
  };
}

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  postCount: number;
};

export async function readCategoriesForAdmin(): Promise<AdminCategory[]> {
  const rows = await prisma.postCategory.findMany({
    orderBy: { position: "asc" },
    include: { _count: { select: { posts: true } } },
  });
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description ?? "",
    color: c.color,
    postCount: c._count.posts,
  }));
}
