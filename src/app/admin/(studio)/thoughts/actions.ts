"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/admin/audit";
import {
  AdminAuthError,
  requireAdmin,
  type AdminActor,
} from "@/lib/admin/session";
import { slugify } from "@/lib/slugify";
import { THOUGHTS_TAG } from "@/lib/site/thoughts-data";
import { SAMPLE_POSTS } from "@/lib/site/thoughts-content";

type Fail = {
  success: false;
  message: string;
  errors?: Record<string, string>;
};
type Ok<T = object> = { success: true } & T;

export type PostForm = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover: string;
  categoryId: string;
  authorId: string;
  tags: string[];
  isFeatured: boolean;
  seoTitle: string;
  seoDescription: string;
  status: "DRAFT" | "PUBLISHED";
  /** ISO; for PUBLISHED, a future date means scheduled. */
  publishedAt: string | null;
};

async function actor(): Promise<AdminActor | Fail> {
  try {
    return await requireAdmin("thoughts");
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof AdminAuthError && error.status === 403
          ? "You don't have access to manage Thoughts."
          : "Your session has ended. Sign in again.",
    };
  }
}
const failed = (v: unknown): v is Fail =>
  !!v && typeof v === "object" && "success" in v;

function refresh(id?: string) {
  updateTag(THOUGHTS_TAG);
  revalidatePath("/admin/thoughts");
  if (id) revalidatePath(`/admin/thoughts/${id}`);
}

const plainText = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim();

const base = z.object({
  title: z.string().trim().min(1, "Required").max(160),
  slug: z.string().trim().max(120),
  excerpt: z.string().trim().max(400),
  content: z.string().max(500_000),
  cover: z.string().max(2000),
  categoryId: z.string(),
  authorId: z.string(),
  tags: z.array(z.string().trim().min(1).max(30)).max(12),
  isFeatured: z.boolean(),
  seoTitle: z.string().trim().max(70),
  seoDescription: z.string().trim().max(170),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  publishedAt: z
    .string()
    .nullable()
    .refine((v) => v === null || !Number.isNaN(Date.parse(v)), "Pick a date"),
});

export async function savePost(
  id: string | null,
  input: PostForm,
): Promise<Ok<{ id: string; slug: string }> | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const parsed = base.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[i.path.join(".")] ??= i.message;
    return { success: false, message: "Some fields need attention.", errors };
  }
  const d = parsed.data;

  // Publishing needs the parts readers see.
  if (d.status === "PUBLISHED") {
    const errors: Record<string, string> = {};
    if (!d.excerpt) errors.excerpt = "Add a summary before publishing";
    if (plainText(d.content).length < 20 && !/<(img|iframe)/.test(d.content))
      errors.content = "Write the article before publishing";
    if (Object.keys(errors).length)
      return {
        success: false,
        message: "Add a summary and the article before publishing.",
        errors,
      };
  }

  const slug = slugify(d.slug || d.title.replace(/\*/g, "")) || "article";
  const clash = await prisma.post.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (clash && clash.id !== id)
    return {
      success: false,
      message: `Another article already uses /thoughts/${slug}.`,
      errors: { slug: "Already used" },
    };

  const existing = id
    ? await prisma.post.findUnique({
        where: { id },
        select: { status: true, publishedAt: true },
      })
    : null;
  if (id && !existing)
    return { success: false, message: "That article no longer exists." };

  // Publishing with no date publishes now.
  const publishedAt =
    d.status === "PUBLISHED"
      ? d.publishedAt
        ? new Date(d.publishedAt)
        : new Date()
      : d.publishedAt
        ? new Date(d.publishedAt)
        : null;

  const data = {
    title: d.title,
    slug,
    excerpt: d.excerpt,
    content: d.content,
    coverPublicId: d.cover || null,
    categoryId: d.categoryId || null,
    authorId: d.authorId || null,
    tags: JSON.stringify(d.tags),
    isFeatured: d.isFeatured,
    seoTitle: d.seoTitle || null,
    seoDescription: d.seoDescription || null,
    status: d.status,
    publishedAt,
  };
  try {
    const row = id
      ? await prisma.post.update({ where: { id }, data })
      : await prisma.post.create({ data });
    const wasLive = existing?.status === "PUBLISHED";
    const now = Date.now();
    const verb =
      d.status === "DRAFT"
        ? wasLive
          ? "Unpublished"
          : id
            ? "Saved the draft"
            : "Started the draft"
        : publishedAt!.getTime() > now
          ? "Scheduled"
          : wasLive
            ? "Updated"
            : "Published";
    await logAudit({
      action: `thoughts.${verb.toLowerCase().replace(/\s+/g, "_")}`,
      area: "thoughts",
      summary: `${verb} ${verb === "Saved the draft" || verb === "Started the draft" ? "of" : "the article"} ${d.title.replace(/\*/g, "")}`,
      entityType: "Post",
      entityId: row.id,
      actor: a,
    });
    refresh(row.id);
    return { success: true, id: row.id, slug: row.slug };
  } catch {
    return {
      success: false,
      message: "That couldn't be saved. Please try again.",
    };
  }
}

export async function setPostsFeatured(
  ids: string[],
  isFeatured: boolean,
): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  await prisma.post.updateMany({
    where: { id: { in: ids } },
    data: { isFeatured },
  });
  await logAudit({
    action: "thoughts.featured",
    area: "thoughts",
    summary: `${isFeatured ? "Featured" : "Unfeatured"} ${ids.length} article${ids.length === 1 ? "" : "s"}`,
    actor: a,
  });
  refresh();
  return { success: true };
}

export async function unpublishPosts(ids: string[]): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  await prisma.post.updateMany({
    where: { id: { in: ids } },
    data: { status: "DRAFT" },
  });
  await logAudit({
    action: "thoughts.unpublished",
    area: "thoughts",
    summary: `Moved ${ids.length} article${ids.length === 1 ? "" : "s"} back to drafts`,
    actor: a,
  });
  refresh();
  return { success: true };
}

export async function deletePosts(ids: string[]): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const { count } = await prisma.post.deleteMany({
    where: { id: { in: ids } },
  });
  await logAudit({
    action: "thoughts.deleted",
    area: "thoughts",
    summary: `Deleted ${count} article${count === 1 ? "" : "s"}`,
    actor: a,
  });
  refresh();
  return { success: true };
}

export async function duplicatePost(
  id: string,
): Promise<Ok<{ id: string }> | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const p = await prisma.post.findUnique({ where: { id } });
  if (!p) return { success: false, message: "That article no longer exists." };
  let slug = `${p.slug}-copy`;
  for (let n = 2; await prisma.post.findUnique({ where: { slug } }); n++)
    slug = `${p.slug}-copy-${n}`;
  const copy = await prisma.post.create({
    data: {
      title: `${p.title} (copy)`.slice(0, 160),
      slug,
      excerpt: p.excerpt,
      content: p.content,
      coverPublicId: p.coverPublicId,
      categoryId: p.categoryId,
      authorId: p.authorId,
      tags: p.tags,
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
      status: "DRAFT",
    },
  });
  await logAudit({
    action: "thoughts.duplicated",
    area: "thoughts",
    summary: `Copied the article ${p.title.replace(/\*/g, "")}`,
    entityType: "Post",
    entityId: copy.id,
    actor: a,
  });
  refresh();
  return { success: true, id: copy.id };
}

/** Adds the site's sample articles as drafts, to edit or learn from. */
export async function importSamplePosts(): Promise<
  Ok<{ count: number }> | Fail
> {
  const a = await actor();
  if (failed(a)) return a;
  const [cats, team, existing] = await Promise.all([
    prisma.postCategory.findMany({ select: { id: true, slug: true } }),
    prisma.aboutTeamMember.findMany({
      where: { isVisible: true },
      orderBy: { position: "asc" },
      select: { id: true },
    }),
    prisma.post.findMany({ select: { slug: true } }),
  ]);
  const used = new Set(existing.map((p) => p.slug));
  const rows = SAMPLE_POSTS.filter((p) => !used.has(p.slug)).map((p) => ({
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    content: p.content,
    coverPublicId: p.cover,
    categoryId: cats.find((c) => c.slug === p.category)?.id ?? null,
    authorId: team[p.author]?.id ?? team[0]?.id ?? null,
    tags: JSON.stringify(p.tags ?? []),
    isFeatured: Boolean(p.featured),
    status: "DRAFT" as const,
  }));
  if (rows.length) await prisma.post.createMany({ data: rows });
  await logAudit({
    action: "thoughts.samples_imported",
    area: "thoughts",
    summary: `Added ${rows.length} sample article${rows.length === 1 ? "" : "s"} as drafts`,
    actor: a,
  });
  refresh();
  return { success: true, count: rows.length };
}

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

const categorySchema = z.object({
  name: z.string().trim().min(1, "Required").max(40),
  slug: z.string().trim().max(60),
  description: z.string().trim().max(200),
  color: z.string().max(20),
});

export async function saveCategory(
  id: string | null,
  input: z.infer<typeof categorySchema>,
): Promise<Ok<{ id: string }> | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success)
    return {
      success: false,
      message: "Give the category a name.",
      errors: { name: "Required" },
    };
  const d = parsed.data;
  const slug = slugify(d.slug || d.name);
  if (!slug) return { success: false, message: "Give the category a name." };
  const clash = await prisma.postCategory.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (clash && clash.id !== id)
    return {
      success: false,
      message: `Another category already uses /thoughts/category/${slug}.`,
      errors: { slug: "Already used" },
    };
  const data = {
    name: d.name,
    slug,
    description: d.description || null,
    color: d.color || "ice",
  };
  const row = id
    ? await prisma.postCategory.update({ where: { id }, data })
    : await prisma.postCategory.create({
        data: { ...data, position: await prisma.postCategory.count() },
      });
  await logAudit({
    action: id ? "thoughts.category_updated" : "thoughts.category_created",
    area: "thoughts",
    summary: `${id ? "Edited" : "Added"} the category ${d.name}`,
    entityType: "PostCategory",
    entityId: row.id,
    actor: a,
  });
  updateTag(THOUGHTS_TAG);
  revalidatePath("/admin/thoughts/categories");
  return { success: true, id: row.id };
}

export async function reorderCategories(ids: string[]): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  await prisma.$transaction(
    ids.map((id, position) =>
      prisma.postCategory.update({ where: { id }, data: { position } }),
    ),
  );
  updateTag(THOUGHTS_TAG);
  revalidatePath("/admin/thoughts/categories");
  return { success: true };
}

export async function deleteCategory(id: string): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const c = await prisma.postCategory.findUnique({ where: { id } });
  if (!c) return { success: true };
  await prisma.postCategory.delete({ where: { id } });
  await logAudit({
    action: "thoughts.category_deleted",
    area: "thoughts",
    summary: `Deleted the category ${c.name}`,
    entityType: "PostCategory",
    entityId: id,
    actor: a,
  });
  updateTag(THOUGHTS_TAG);
  revalidatePath("/admin/thoughts/categories");
  return { success: true };
}
