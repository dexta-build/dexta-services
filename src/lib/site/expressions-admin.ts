import "server-only";
import prisma from "@/lib/prisma";
import { EXPRESSION_DEFAULTS } from "./expressions-content";
import { htmlToBlocks } from "./story-blocks";

export type SeedResult = { ready: true } | { ready: false; message: string };

function parse<T>(raw: string | null | undefined, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Copies the four built-in products into the Expression table the first
 * time, so they can be edited. Does nothing once there are rows.
 */
export async function ensureExpressionsSeeded(): Promise<SeedResult> {
  try {
    if ((await prisma.expression.count()) > 0) return { ready: true };
    await prisma.$transaction(
      EXPRESSION_DEFAULTS.map((e, i) =>
        prisma.expression.create({
          data: {
            name: e.name,
            slug: e.slug,
            tagline: e.tagline,
            category: e.category,
            description: e.description,
            websiteUrl: e.websiteUrl,
            color: e.color,
            logoPublicId: e.icon,
            coverPublicId: e.cover,
            mobilePublicId: e.mobile,
            gallery: "[]",
            features: JSON.stringify(e.features),
            facts: JSON.stringify(e.facts),
            story: e.story,
            position: i,
          },
        }),
      ),
    );
    return { ready: true };
  } catch (error) {
    if ((await prisma.expression.count().catch(() => 0)) > 0)
      return { ready: true };
    const message = (error as Error).message ?? "";
    console.warn(
      "[expressions] could not copy the built-in products:",
      message,
    );
    return {
      ready: false,
      message: /gallery|column|does not exist|Unknown argument/i.test(message)
        ? "Run the database update for this release (prisma db push), restart the site, then refresh."
        : `Something went wrong: ${message}`,
    };
  }
}

/** Every product with its editable fields, for the admin. */
export async function readExpressionsForAdmin() {
  const rows = await prisma.expression.findMany({
    orderBy: { position: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    form: {
      name: r.name,
      slug: r.slug ?? "",
      tagline: r.tagline ?? "",
      category: r.category ?? "",
      description: r.description,
      websiteUrl: r.websiteUrl,
      color: r.color ?? "brand",
      logo: r.logoPublicId ?? "",
      cover: r.coverPublicId ?? "",
      mobile: r.mobilePublicId ?? "",
      gallery: parse<string[]>((r as { gallery?: string }).gallery, []),
      facts: parse<{ value: string; label: string }[]>(r.facts, []),
      features: parse<string[]>(r.features, []),
      story: htmlToBlocks(r.story ?? ""),
      isVisible: r.isVisible,
    },
  }));
}
