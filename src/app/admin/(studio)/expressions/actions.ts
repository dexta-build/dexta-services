"use server";

import { revalidatePath, updateTag } from "next/cache";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/admin/audit";
import {
  AdminAuthError,
  requireAdmin,
  type AdminActor,
} from "@/lib/admin/session";
import { objectSchema } from "@/lib/content/fields";
import { EXPRESSION_FIELDS } from "@/lib/site/expression-fields";
import { blocksToHtml, type StoryBlock } from "@/lib/site/story-blocks";
import { slugify } from "@/lib/slugify";

type Fail = {
  success: false;
  message: string;
  errors?: Record<string, string>;
};
type Ok<T = object> = { success: true } & T;

const TAGS = ["expressions-content", "clients-content"];

async function actor(): Promise<AdminActor | Fail> {
  try {
    return await requireAdmin("works");
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof AdminAuthError && error.status === 403
          ? "You don't have access to manage Our Expressions."
          : "Your session has ended. Sign in again.",
    };
  }
}
const failed = (v: unknown): v is Fail =>
  !!v && typeof v === "object" && "success" in v;

function refresh() {
  for (const t of TAGS) updateTag(t);
  revalidatePath("/admin/expressions");
}

export type ExpressionForm = {
  name: string;
  slug: string;
  tagline: string;
  category: string;
  description: string;
  websiteUrl: string;
  color: string;
  logo: string;
  cover: string;
  mobile: string;
  gallery: string[];
  facts: { value: string; label: string }[];
  features: string[];
  story: StoryBlock[];
  isVisible: boolean;
};

const dbError = (error: unknown) =>
  /column|does not exist|Unknown argument/i.test((error as Error).message ?? "")
    ? "Our Expressions needs the database update for this release (prisma db push), then a restart."
    : "That couldn't be saved. Please try again.";

export async function saveExpression(
  id: string | null,
  input: ExpressionForm,
): Promise<Ok<{ id: string }> | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const parsed = objectSchema(EXPRESSION_FIELDS).safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues)
      errors[i.path.join(".")] ??= i.message.startsWith("Invalid")
        ? "Please check this field."
        : i.message;
    return { success: false, message: "Some fields need attention.", errors };
  }
  const d = parsed.data as unknown as ExpressionForm;
  const slug = slugify(d.slug || d.name);
  if (!slug)
    return { success: false, message: "Give the product a page address." };
  const clash = await prisma.expression.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (clash && clash.id !== id)
    return {
      success: false,
      message: `Another product already uses /expressions/${slug}.`,
    };

  const data = {
    name: d.name,
    slug,
    tagline: d.tagline,
    category: d.category,
    description: d.description,
    websiteUrl: d.websiteUrl,
    color: d.color,
    logoPublicId: d.logo || null,
    coverPublicId: d.cover || null,
    mobilePublicId: d.mobile || null,
    gallery: JSON.stringify(d.gallery ?? []),
    facts: JSON.stringify(d.facts ?? []),
    features: JSON.stringify((d.features ?? []).filter(Boolean)),
    story: blocksToHtml(d.story ?? []),
    isVisible: d.isVisible,
  };
  try {
    const row = id
      ? await prisma.expression.update({ where: { id }, data })
      : await prisma.expression.create({
          data: { ...data, position: await prisma.expression.count() },
        });
    await logAudit({
      action: id ? "works.expression_updated" : "works.expression_created",
      area: "works",
      summary: `${id ? "Edited" : "Added"} the product ${d.name}`,
      entityType: "Expression",
      entityId: row.id,
      actor: a,
    });
    refresh();
    return { success: true, id: row.id };
  } catch (error) {
    return { success: false, message: dbError(error) };
  }
}

export async function setExpressionVisible(
  id: string,
  isVisible: boolean,
): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const e = await prisma.expression.update({
    where: { id },
    data: { isVisible },
  });
  await logAudit({
    action: "works.expression_visibility",
    area: "works",
    summary: `${isVisible ? "Showed" : "Hid"} the product ${e.name}`,
    entityType: "Expression",
    entityId: id,
    actor: a,
  });
  refresh();
  return { success: true };
}

export async function reorderExpressions(ids: string[]): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  await prisma.$transaction(
    ids.map((id, i) =>
      prisma.expression.update({ where: { id }, data: { position: i } }),
    ),
  );
  await logAudit({
    action: "works.expressions_reordered",
    area: "works",
    summary: "Reordered Our Expressions",
    actor: a,
  });
  refresh();
  return { success: true };
}

export async function deleteExpression(id: string): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const e = await prisma.expression.findUnique({ where: { id } });
  if (!e) return { success: true };
  const left = await prisma.expression.count();
  if (left <= 1)
    return {
      success: false,
      message: "Keep at least one product. Hide it instead.",
    };
  await prisma.expression.delete({ where: { id } });
  await logAudit({
    action: "works.expression_deleted",
    area: "works",
    summary: `Deleted the product ${e.name}`,
    entityType: "Expression",
    entityId: id,
    actor: a,
  });
  refresh();
  return { success: true };
}
