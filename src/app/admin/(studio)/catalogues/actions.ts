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
import { objectSchema } from "@/lib/content/fields";
import {
  CATALOGUE_FIELDS,
  type CatalogueForm,
  type ItemForm,
} from "@/lib/catalogue/fields";
import type { CsvItem } from "@/lib/catalogue/csv";
import { slugify } from "@/lib/slugify";
import { isVideoSource } from "@/lib/site/stock-media";

type Fail = {
  success: false;
  message: string;
  errors?: Record<string, string>;
};
type Ok<T = object> = { success: true } & T;

async function actor(): Promise<AdminActor | Fail> {
  try {
    return await requireAdmin("catalogue");
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof AdminAuthError && error.status === 403
          ? "You don't have access to manage catalogues."
          : "Your session has ended. Sign in again.",
    };
  }
}
const failed = (v: unknown): v is Fail =>
  !!v && typeof v === "object" && "success" in v;

function refresh(catalogueId?: string) {
  updateTag("catalogues");
  revalidatePath("/admin/catalogues");
  if (catalogueId) revalidatePath(`/admin/catalogues/${catalogueId}`);
}

const zodErrors = (issues: z.core.$ZodIssue[]) => {
  const errors: Record<string, string> = {};
  for (const i of issues)
    errors[i.path.join(".")] ??= i.message.startsWith("Invalid")
      ? "Please check this field."
      : i.message;
  return errors;
};

const SAVE_FAILED = "That couldn't be saved. Please try again.";

/* ------------------------------------------------------------------ */
/* Catalogues                                                          */
/* ------------------------------------------------------------------ */

export async function saveCatalogue(
  id: string | null,
  input: CatalogueForm,
): Promise<Ok<{ id: string }> | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const parsed = objectSchema(CATALOGUE_FIELDS).safeParse(input);
  if (!parsed.success)
    return {
      success: false,
      message: "Some fields need attention.",
      errors: zodErrors(parsed.error.issues),
    };
  const d = parsed.data as unknown as CatalogueForm;
  const slug = slugify(d.slug || d.title);
  if (!slug)
    return { success: false, message: "Give the catalogue a page address." };
  const clash = await prisma.catalogue.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (clash && clash.id !== id)
    return {
      success: false,
      message: `Another catalogue already uses /catalogue/${slug}.`,
      errors: { slug: "Already used" },
    };
  const data = {
    slug,
    title: d.title.trim(),
    description: d.description.trim(),
    accent: d.color,
    icon: d.icon,
    coverPublicId: d.cover || null,
    heroTitle: d.heroTitle?.trim() || null,
    heroText: d.heroText?.trim() || null,
    isFeatured: d.isFeatured,
    showOnHome: d.showOnHome,
    isVisible: d.isVisible,
  };
  try {
    const row = id
      ? await prisma.catalogue.update({ where: { id }, data })
      : await prisma.catalogue.create({
          data: { ...data, position: await prisma.catalogue.count() },
        });
    await logAudit({
      action: id ? "catalogue.updated" : "catalogue.created",
      area: "catalogue",
      summary: `${id ? "Edited" : "Added"} the ${data.title} catalogue`,
      entityType: "Catalogue",
      entityId: row.id,
      actor: a,
    });
    refresh(row.id);
    return { success: true, id: row.id };
  } catch {
    return { success: false, message: SAVE_FAILED };
  }
}

export async function setCatalogueFlags(
  id: string,
  flags: Partial<Record<"isVisible" | "isFeatured" | "showOnHome", boolean>>,
): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const c = await prisma.catalogue.update({ where: { id }, data: flags });
  const what = Object.entries(flags)
    .map(([k, v]) =>
      k === "isVisible"
        ? v
          ? "showed"
          : "hid"
        : k === "isFeatured"
          ? v
            ? "featured in the menu"
            : "unfeatured in the menu"
          : v
            ? "added to the homepage"
            : "removed from the homepage",
    )
    .join(", ");
  await logAudit({
    action: "catalogue.flags",
    area: "catalogue",
    summary: `The ${c.title} catalogue: ${what}`,
    entityType: "Catalogue",
    entityId: id,
    actor: a,
  });
  refresh(id);
  return { success: true };
}

export async function reorderCatalogues(ids: string[]): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  await prisma.$transaction(
    ids.map((id, position) =>
      prisma.catalogue.update({ where: { id }, data: { position } }),
    ),
  );
  await logAudit({
    action: "catalogue.reordered",
    area: "catalogue",
    summary: "Reordered the catalogues",
    actor: a,
  });
  refresh();
  return { success: true };
}

export async function deleteCatalogue(id: string): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const c = await prisma.catalogue.findUnique({ where: { id } });
  if (!c) return { success: true };
  if ((await prisma.catalogue.count()) <= 1)
    return {
      success: false,
      message: "Keep at least one catalogue. Hide it instead.",
    };
  await prisma.catalogue.delete({ where: { id } });
  await logAudit({
    action: "catalogue.deleted",
    area: "catalogue",
    summary: `Deleted the ${c.title} catalogue and its designs`,
    entityType: "Catalogue",
    entityId: id,
    actor: a,
  });
  refresh();
  return { success: true };
}

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export async function saveCategory(
  catalogueId: string,
  id: string | null,
  name: string,
): Promise<Ok<{ id: string }> | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const clean = name.trim().slice(0, 60);
  const slug = slugify(clean);
  if (!clean || !slug)
    return { success: false, message: "Give the category a name." };
  const clash = await prisma.catalogueCategory.findUnique({
    where: { catalogueId_slug: { catalogueId, slug } },
    select: { id: true },
  });
  if (clash && clash.id !== id)
    return {
      success: false,
      message: "This catalogue already has that category.",
    };
  try {
    const row = id
      ? await prisma.catalogueCategory.update({
          where: { id },
          data: { name: clean, slug },
        })
      : await prisma.catalogueCategory.create({
          data: {
            catalogueId,
            name: clean,
            slug,
            position: await prisma.catalogueCategory.count({
              where: { catalogueId },
            }),
          },
        });
    await logAudit({
      action: id ? "catalogue.category_updated" : "catalogue.category_created",
      area: "catalogue",
      summary: `${id ? "Renamed a category to" : "Added the category"} ${clean}`,
      entityType: "CatalogueCategory",
      entityId: row.id,
      actor: a,
    });
    refresh(catalogueId);
    return { success: true, id: row.id };
  } catch {
    return { success: false, message: SAVE_FAILED };
  }
}

export async function setCategoryVisible(
  catalogueId: string,
  id: string,
  isVisible: boolean,
): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const c = await prisma.catalogueCategory.update({
    where: { id },
    data: { isVisible },
  });
  await logAudit({
    action: "catalogue.category_visibility",
    area: "catalogue",
    summary: `${isVisible ? "Showed" : "Hid"} the category ${c.name}`,
    entityType: "CatalogueCategory",
    entityId: id,
    actor: a,
  });
  refresh(catalogueId);
  return { success: true };
}

export async function reorderCategories(
  catalogueId: string,
  ids: string[],
): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  await prisma.$transaction(
    ids.map((id, position) =>
      prisma.catalogueCategory.update({ where: { id }, data: { position } }),
    ),
  );
  refresh(catalogueId);
  return { success: true };
}

/** Deletes a category; its designs move to `moveTo` (or no category). */
export async function deleteCategory(
  catalogueId: string,
  id: string,
  moveTo: string | null,
): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const c = await prisma.catalogueCategory.findUnique({ where: { id } });
  if (!c) return { success: true };
  await prisma.$transaction([
    prisma.catalogueItem.updateMany({
      where: { categoryId: id },
      data: { categoryId: moveTo || null },
    }),
    prisma.catalogueCategory.delete({ where: { id } }),
  ]);
  await logAudit({
    action: "catalogue.category_deleted",
    area: "catalogue",
    summary: `Deleted the category ${c.name}`,
    entityType: "CatalogueCategory",
    entityId: id,
    actor: a,
  });
  refresh(catalogueId);
  return { success: true };
}

/* ------------------------------------------------------------------ */
/* Items (designs)                                                     */
/* ------------------------------------------------------------------ */

const itemSchema = z.object({
  title: z.string().trim().min(1, "Required").max(120),
  slug: z.string().max(120),
  description: z.string().max(600),
  categoryId: z.string(),
  price: z
    .number()
    .int("Whole naira only")
    .min(0, "Can't be negative")
    .max(1_000_000_000),
  moq: z.number().int("Whole number").min(1, "At least 1").max(1_000_000),
  unit: z.string().trim().min(1, "Required").max(40),
  tags: z.array(z.string().trim().min(1).max(30)).max(12),
  media: z.array(z.string().min(1).max(2000)).max(20),
  isFeatured: z.boolean(),
  isVisible: z.boolean(),
});

async function uniqueItemSlug(
  catalogueId: string,
  base: string,
  id: string | null,
) {
  let slug = base || "design";
  for (let n = 2; ; n++) {
    const clash = await prisma.catalogueItem.findUnique({
      where: { catalogueId_slug: { catalogueId, slug } },
      select: { id: true },
    });
    if (!clash || clash.id === id) return slug;
    slug = `${base}-${n}`;
  }
}

const mediaRows = (media: string[]) =>
  media.map((publicId, position) => ({
    publicId,
    mediaType: isVideoSource(publicId)
      ? ("VIDEO" as const)
      : ("IMAGE" as const),
    position,
  }));

export async function saveItem(
  catalogueId: string,
  id: string | null,
  input: ItemForm,
): Promise<Ok<{ id: string }> | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const parsed = itemSchema.safeParse(input);
  if (!parsed.success)
    return {
      success: false,
      message: "Some fields need attention.",
      errors: zodErrors(parsed.error.issues),
    };
  const d = parsed.data;
  const requested = slugify(d.slug || d.title);
  if (id && d.slug) {
    const clash = await prisma.catalogueItem.findUnique({
      where: { catalogueId_slug: { catalogueId, slug: requested } },
      select: { id: true },
    });
    if (clash && clash.id !== id)
      return {
        success: false,
        message: "Another design in this catalogue uses that address.",
        errors: { slug: "Already used" },
      };
  }
  const slug = await uniqueItemSlug(catalogueId, requested, id);
  const data = {
    slug,
    title: d.title,
    description: d.description.trim(),
    categoryId: d.categoryId || null,
    price: d.price,
    moq: d.moq,
    unit: d.unit,
    tags: JSON.stringify(d.tags),
    isFeatured: d.isFeatured,
    isVisible: d.isVisible,
    // Edited by hand, so it's no longer a placeholder sample.
    isSample: false,
  };
  try {
    const row = await prisma.$transaction(async (tx) => {
      const item = id
        ? await tx.catalogueItem.update({ where: { id }, data })
        : await tx.catalogueItem.create({
            data: {
              ...data,
              catalogueId,
              position: await tx.catalogueItem.count({
                where: { catalogueId },
              }),
            },
          });
      await tx.catalogueMedia.deleteMany({ where: { itemId: item.id } });
      if (d.media.length)
        await tx.catalogueMedia.createMany({
          data: mediaRows(d.media).map((m) => ({ ...m, itemId: item.id })),
        });
      return item;
    });
    await logAudit({
      action: id ? "catalogue.item_updated" : "catalogue.item_created",
      area: "catalogue",
      summary: `${id ? "Edited" : "Added"} the design ${d.title}`,
      entityType: "CatalogueItem",
      entityId: row.id,
      actor: a,
    });
    refresh(catalogueId);
    return { success: true, id: row.id };
  } catch {
    return { success: false, message: SAVE_FAILED };
  }
}

export async function setItemsFlags(
  catalogueId: string,
  ids: string[],
  flags: Partial<Record<"isVisible" | "isFeatured", boolean>>,
): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  await prisma.catalogueItem.updateMany({
    where: { id: { in: ids }, catalogueId },
    data: flags,
  });
  const [k, v] = Object.entries(flags)[0] ?? [];
  await logAudit({
    action: "catalogue.items_flags",
    area: "catalogue",
    summary: `${k === "isVisible" ? (v ? "Showed" : "Hid") : v ? "Featured" : "Unfeatured"} ${ids.length} design${ids.length === 1 ? "" : "s"}`,
    entityType: "Catalogue",
    entityId: catalogueId,
    actor: a,
  });
  refresh(catalogueId);
  return { success: true };
}

export async function moveItems(
  catalogueId: string,
  ids: string[],
  categoryId: string | null,
): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  await prisma.catalogueItem.updateMany({
    where: { id: { in: ids }, catalogueId },
    data: { categoryId },
  });
  await logAudit({
    action: "catalogue.items_moved",
    area: "catalogue",
    summary: `Moved ${ids.length} design${ids.length === 1 ? "" : "s"} to another category`,
    entityType: "Catalogue",
    entityId: catalogueId,
    actor: a,
  });
  refresh(catalogueId);
  return { success: true };
}

export async function deleteItems(
  catalogueId: string,
  ids: string[],
): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const { count } = await prisma.catalogueItem.deleteMany({
    where: { id: { in: ids }, catalogueId },
  });
  await logAudit({
    action: "catalogue.items_deleted",
    area: "catalogue",
    summary: `Deleted ${count} design${count === 1 ? "" : "s"}`,
    entityType: "Catalogue",
    entityId: catalogueId,
    actor: a,
  });
  refresh(catalogueId);
  return { success: true };
}

/** Deletes the copied sample designs (one catalogue, or all). */
export async function deleteSampleItems(
  catalogueId: string | null,
): Promise<Ok<{ count: number }> | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const { count } = await prisma.catalogueItem.deleteMany({
    where: { isSample: true, ...(catalogueId ? { catalogueId } : {}) },
  });
  await logAudit({
    action: "catalogue.samples_deleted",
    area: "catalogue",
    summary: `Deleted ${count} sample design${count === 1 ? "" : "s"}`,
    actor: a,
  });
  refresh(catalogueId ?? undefined);
  return { success: true, count };
}

export async function reorderItems(
  catalogueId: string,
  ids: string[],
): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  await prisma.$transaction(
    ids.map((id, position) =>
      prisma.catalogueItem.update({ where: { id }, data: { position } }),
    ),
  );
  refresh(catalogueId);
  return { success: true };
}

/* ------------------------------------------------------------------ */
/* Bulk prices                                                         */
/* ------------------------------------------------------------------ */

const priceRows = z
  .array(
    z.object({
      id: z.string(),
      price: z.number().int().min(0).max(1_000_000_000),
      moq: z.number().int().min(1).max(1_000_000),
    }),
  )
  .max(2000);

/** Saves prices and minimum orders typed into the price sheet. */
export async function savePrices(
  catalogueId: string,
  rows: { id: string; price: number; moq: number }[],
): Promise<Ok<{ count: number }> | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const parsed = priceRows.safeParse(rows);
  if (!parsed.success)
    return { success: false, message: "Some prices aren't whole numbers." };
  if (parsed.data.length === 0) return { success: true, count: 0 };
  await prisma.$transaction(
    parsed.data.map((r) =>
      prisma.catalogueItem.update({
        where: { id: r.id, catalogueId },
        data: { price: r.price, moq: r.moq, isSample: false },
      }),
    ),
  );
  await logAudit({
    action: "catalogue.prices_updated",
    area: "catalogue",
    summary: `Updated prices for ${parsed.data.length} design${parsed.data.length === 1 ? "" : "s"}`,
    entityType: "Catalogue",
    entityId: catalogueId,
    actor: a,
  });
  refresh(catalogueId);
  return { success: true, count: parsed.data.length };
}

export type PriceChange = {
  mode: "percent" | "amount" | "set";
  /** Percent (e.g. 10 or -5), naira to add/subtract, or the new price. */
  value: number;
  /** Round results to the nearest 1, 10, 50 or 100 naira. */
  roundTo: 1 | 10 | 50 | 100;
};

export async function adjustPrices(
  catalogueId: string,
  ids: string[],
  change: PriceChange,
): Promise<Ok<{ count: number }> | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  if (
    !Number.isFinite(change.value) ||
    ![1, 10, 50, 100].includes(change.roundTo)
  )
    return { success: false, message: "Enter a number." };
  const items = await prisma.catalogueItem.findMany({
    where: { id: { in: ids }, catalogueId },
    select: { id: true, price: true },
  });
  const next = (price: number) => {
    const raw =
      change.mode === "percent"
        ? price * (1 + change.value / 100)
        : change.mode === "amount"
          ? price + change.value
          : change.value;
    return Math.max(0, Math.round(raw / change.roundTo) * change.roundTo);
  };
  await prisma.$transaction(
    items.map((it) =>
      prisma.catalogueItem.update({
        where: { id: it.id },
        data: { price: next(it.price), isSample: false },
      }),
    ),
  );
  const how =
    change.mode === "percent"
      ? `${change.value >= 0 ? "+" : ""}${change.value}%`
      : change.mode === "amount"
        ? `${change.value >= 0 ? "+" : "−"}₦${Math.abs(change.value).toLocaleString("en-NG")}`
        : `set to ₦${change.value.toLocaleString("en-NG")}`;
  await logAudit({
    action: "catalogue.prices_adjusted",
    area: "catalogue",
    summary: `Changed ${items.length} price${items.length === 1 ? "" : "s"} (${how})`,
    entityType: "Catalogue",
    entityId: catalogueId,
    actor: a,
  });
  refresh(catalogueId);
  return { success: true, count: items.length };
}

/* ------------------------------------------------------------------ */
/* CSV import                                                          */
/* ------------------------------------------------------------------ */

const csvItem = z.object({
  title: z.string().trim().min(1).max(120),
  category: z.string().max(60),
  price: z.number().int().min(0).max(1_000_000_000),
  moq: z.number().int().min(1).max(1_000_000),
  unit: z.string().max(40),
  description: z.string().max(600),
  tags: z.array(z.string().max(30)).max(12),
  images: z.array(z.string().max(2000)).max(20),
  featured: z.boolean(),
  visible: z.boolean(),
  slug: z.string().max(120),
});

/**
 * Adds designs from a CSV. With `update`, a row whose address (slug, or
 * the title made into one) matches an existing design updates it instead.
 * Categories are matched by name and created when new.
 */
export async function importItems(
  catalogueId: string,
  rows: CsvItem[],
  update: boolean,
): Promise<Ok<{ created: number; updated: number }> | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const parsed = z.array(csvItem).max(1000).safeParse(rows);
  if (!parsed.success)
    return {
      success: false,
      message: "Some rows couldn't be read. Check the file and try again.",
    };
  const catalogue = await prisma.catalogue.findUnique({
    where: { id: catalogueId },
    include: {
      categories: true,
      items: { select: { id: true, slug: true } },
    },
  });
  if (!catalogue)
    return { success: false, message: "That catalogue no longer exists." };

  let created = 0;
  let updated = 0;
  try {
    await prisma.$transaction(
      async (tx) => {
        const cats = new Map(
          catalogue.categories.map((c) => [c.name.toLowerCase(), c.id]),
        );
        let catPos = catalogue.categories.length;
        let itemPos = catalogue.items.length;
        const existing = new Map(catalogue.items.map((i) => [i.slug, i.id]));
        const usedSlugs = new Set(catalogue.items.map((i) => i.slug));

        for (const r of parsed.data) {
          let categoryId: string | null = null;
          const catName = r.category.trim();
          if (catName) {
            categoryId = cats.get(catName.toLowerCase()) ?? null;
            if (!categoryId) {
              let catSlug = slugify(catName) || `category-${catPos + 1}`;
              while (catalogue.categories.some((c) => c.slug === catSlug))
                catSlug = `${catSlug}-2`;
              const cat = await tx.catalogueCategory.create({
                data: {
                  catalogueId,
                  name: catName,
                  slug: catSlug,
                  position: catPos++,
                },
              });
              cats.set(catName.toLowerCase(), cat.id);
              catalogue.categories.push(cat);
              categoryId = cat.id;
            }
          }
          const base = slugify(r.slug || r.title) || "design";
          const data = {
            title: r.title,
            description: r.description,
            categoryId,
            price: r.price,
            moq: r.moq,
            unit: r.unit || "piece",
            tags: JSON.stringify(r.tags),
            isFeatured: r.featured,
            isVisible: r.visible,
            isSample: false,
          };
          const matchId = update ? existing.get(base) : undefined;
          if (matchId) {
            await tx.catalogueItem.update({ where: { id: matchId }, data });
            if (r.images.length) {
              await tx.catalogueMedia.deleteMany({
                where: { itemId: matchId },
              });
              await tx.catalogueMedia.createMany({
                data: mediaRows(r.images).map((m) => ({
                  ...m,
                  itemId: matchId,
                })),
              });
            }
            updated++;
          } else {
            let slug = base;
            for (let n = 2; usedSlugs.has(slug); n++) slug = `${base}-${n}`;
            usedSlugs.add(slug);
            const item = await tx.catalogueItem.create({
              data: { ...data, slug, catalogueId, position: itemPos++ },
            });
            existing.set(slug, item.id);
            if (r.images.length)
              await tx.catalogueMedia.createMany({
                data: mediaRows(r.images).map((m) => ({
                  ...m,
                  itemId: item.id,
                })),
              });
            created++;
          }
        }
      },
      { timeout: 120_000, maxWait: 15_000 },
    );
  } catch (error) {
    console.warn("[catalogues] CSV import failed:", (error as Error).message);
    return {
      success: false,
      message: "The import didn't finish. Nothing was changed.",
    };
  }
  await logAudit({
    action: "catalogue.items_imported",
    area: "catalogue",
    summary: `Imported designs into ${catalogue.title}: ${created} added, ${updated} updated`,
    entityType: "Catalogue",
    entityId: catalogueId,
    actor: a,
  });
  refresh(catalogueId);
  return { success: true, created, updated };
}
