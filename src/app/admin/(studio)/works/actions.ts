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
import { HOME_SAMPLE_PROJECTS } from "@/lib/site/home-content";
import { isVideoSource } from "@/lib/site/stock-media";
import { slugify } from "@/lib/slugify";

type Fail = { success: false; message: string };
type Ok<T = object> = { success: true } & T;

const TAG = "portfolio-content";

async function actor(): Promise<AdminActor | Fail> {
  try {
    return await requireAdmin("works");
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof AdminAuthError && error.status === 403
          ? "You don't have access to manage projects."
          : "Your session has ended. Sign in again.",
    };
  }
}
const failed = (v: unknown): v is Fail =>
  !!v && typeof v === "object" && "success" in v;

function refresh() {
  updateTag(TAG);
  updateTag("hero-content");
  revalidatePath("/admin/works");
}

const projectSchema = z.object({
  title: z.string().trim().min(1, "Give the project a title.").max(120),
  clientName: z.string().trim().max(120).nullable(),
  slug: z
    .string()
    .trim()
    .max(100)
    .regex(
      /^[a-z0-9]*(?:-[a-z0-9]+)*$/,
      "Use lower-case letters, numbers and dashes only.",
    ),
  description: z.string().trim().max(2000),
  serviceType: z.enum(["DESIGN", "BUILD", "PRINT"]),
  service: z.string().max(120).nullable(),
  occasion: z.string().max(80).nullable(),
  tags: z.array(z.string().trim().min(1).max(40)).max(12),
  websiteUrl: z.string().trim().max(500).nullable(),
  media: z
    .array(z.string().min(1).max(2000))
    .min(1, "Add at least one image or video.")
    .max(40),
  isFeatured: z.boolean(),
  isVisible: z.boolean(),
});

export type ProjectInput = z.input<typeof projectSchema>;

async function uniqueSlug(base: string, exceptId?: string) {
  const root = base || "project";
  let slug = root;
  for (let i = 2; i < 100; i++) {
    const clash = await prisma.portfolioItem.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!clash || clash.id === exceptId) return slug;
    slug = `${root}-${i}`;
  }
  return `${root}-${Date.now()}`;
}

/** Creates or updates a project and replaces its gallery (first item = cover). */
export async function saveProject(
  id: string | null,
  input: ProjectInput,
): Promise<Ok<{ id: string }> | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success)
    return { success: false, message: parsed.error.issues[0].message };
  const d = parsed.data;
  const slug = await uniqueSlug(
    d.slug || slugify(d.clientName || d.title),
    id ?? undefined,
  );
  const first = d.media[0];
  const fields = {
    title: d.title,
    clientName: d.clientName || null,
    slug,
    description: d.description || null,
    serviceType: d.serviceType,
    service: d.service || null,
    occasion: d.occasion || null,
    tags: JSON.stringify(d.tags),
    websiteUrl: d.websiteUrl || null,
    isFeatured: d.isFeatured,
    isVisible: d.isVisible,
    // Older columns kept in step with the cover for anything still reading them.
    mediaPublicId: first,
    mediaType: isVideoSource(first) ? ("VIDEO" as const) : ("IMAGE" as const),
    thumbnailPublicId: null,
  };

  try {
    const projectId = await prisma.$transaction(async (tx) => {
      const item = id
        ? await tx.portfolioItem.update({
            where: { id },
            data: { ...fields, coverAssetId: null },
          })
        : await tx.portfolioItem.create({
            data: { ...fields, position: await tx.portfolioItem.count() },
          });
      await tx.portfolioAsset.deleteMany({
        where: { portfolioItemId: item.id },
      });
      let coverId: string | null = null;
      for (const [i, value] of d.media.entries()) {
        const asset = await tx.portfolioAsset.create({
          data: {
            portfolioItemId: item.id,
            publicId: value,
            mediaType: isVideoSource(value) ? "VIDEO" : "IMAGE",
            position: i,
          },
        });
        if (i === 0) coverId = asset.id;
      }
      await tx.portfolioItem.update({
        where: { id: item.id },
        data: { coverAssetId: coverId },
      });
      return item.id;
    });
    await logAudit({
      action: id ? "works.project_updated" : "works.project_created",
      area: "works",
      summary: `${id ? "Edited" : "Added"} the project ${d.clientName || d.title}`,
      entityType: "PortfolioItem",
      entityId: projectId,
      actor: a,
    });
    refresh();
    return { success: true, id: projectId };
  } catch (error) {
    const msg = (error as Error).message ?? "";
    return {
      success: false,
      message: /column|does not exist|Unknown argument/i.test(msg)
        ? "Projects need the database update for this release (prisma db push), then a restart."
        : "The project couldn't be saved. Please try again.",
    };
  }
}

export async function setProjectFlags(
  id: string,
  flags: { isVisible?: boolean; isFeatured?: boolean },
): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const p = await prisma.portfolioItem.update({ where: { id }, data: flags });
  const what =
    flags.isVisible !== undefined
      ? flags.isVisible
        ? "Showed"
        : "Hid"
      : flags.isFeatured
        ? "Featured"
        : "Unfeatured";
  await logAudit({
    action: "works.project_flags",
    area: "works",
    summary: `${what} the project ${p.clientName || p.title}`,
    entityType: "PortfolioItem",
    entityId: id,
    actor: a,
  });
  refresh();
  return { success: true };
}

export async function reorderProjects(ids: string[]): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  await prisma.$transaction(
    ids.map((id, i) =>
      prisma.portfolioItem.update({ where: { id }, data: { position: i } }),
    ),
  );
  await logAudit({
    action: "works.projects_reordered",
    area: "works",
    summary: "Reordered the projects",
    actor: a,
  });
  refresh();
  return { success: true };
}

export async function deleteProject(id: string): Promise<Ok | Fail> {
  const a = await actor();
  if (failed(a)) return a;
  const p = await prisma.portfolioItem.findUnique({ where: { id } });
  if (!p) return { success: true };
  await prisma.$transaction([
    prisma.portfolioItem.update({
      where: { id },
      data: { coverAssetId: null },
    }),
    prisma.portfolioAsset.deleteMany({ where: { portfolioItemId: id } }),
    prisma.portfolioItem.delete({ where: { id } }),
  ]);
  await logAudit({
    action: "works.project_deleted",
    area: "works",
    summary: `Deleted the project ${p.clientName || p.title}`,
    entityType: "PortfolioItem",
    entityId: id,
    actor: a,
  });
  refresh();
  return { success: true };
}

const SAMPLE_SERVICES: Record<string, string> = {
  "sample-wedding": "print/invitation-cards",
  "sample-launch": "design/brand-identity",
  "sample-identity": "design/brand-identity",
  "sample-store": "build/e-commerce",
  "sample-birthday": "print/invitation-cards",
  "sample-portal": "build/websites",
  "sample-corporate": "print/branded-merchandise",
  "sample-booking": "build/mobile-apps",
  "sample-gala": "print/banners-signage",
  "sample-social": "design/social-media-creative",
};
const SAMPLE_OCCASIONS: Record<string, string> = {
  Wedding: "Wedding",
  Events: "Events",
  Birthdays: "Birthday",
  Education: "Education",
  Corporate: "Corporate",
};

/**
 * Copies the sample projects in as real, editable projects (hidden, so
 * nothing changes on the site until you show them). Skips ones already in.
 */
export async function importSampleProjects(): Promise<
  Ok<{ added: number }> | Fail
> {
  const a = await actor();
  if (failed(a)) return a;
  let added = 0;
  try {
    const start = await prisma.portfolioItem.count();
    for (const [i, p] of HOME_SAMPLE_PROJECTS.entries()) {
      if (
        await prisma.portfolioItem.findUnique({
          where: { slug: p.slug },
          select: { id: true },
        })
      )
        continue;
      await prisma.$transaction(async (tx) => {
        const item = await tx.portfolioItem.create({
          data: {
            title: p.title,
            slug: p.slug,
            description: p.description,
            serviceType: p.pillar,
            service: SAMPLE_SERVICES[p.id] ?? null,
            occasion: SAMPLE_OCCASIONS[p.category.split("·")[0].trim()] ?? null,
            tags: JSON.stringify(p.tags),
            isFeatured: Boolean(p.featured),
            isVisible: false,
            position: start + i,
            mediaPublicId: p.images[0],
            mediaType: "IMAGE",
          },
        });
        let coverId: string | null = null;
        for (const [j, img] of p.images.entries()) {
          const asset = await tx.portfolioAsset.create({
            data: {
              portfolioItemId: item.id,
              publicId: img,
              mediaType: "IMAGE",
              position: j,
            },
          });
          if (j === 0) coverId = asset.id;
        }
        await tx.portfolioItem.update({
          where: { id: item.id },
          data: { coverAssetId: coverId },
        });
      });
      added++;
    }
  } catch (error) {
    const msg = (error as Error).message ?? "";
    return {
      success: false,
      message: /column|does not exist|Unknown argument/i.test(msg)
        ? "Projects need the database update for this release (prisma db push), then a restart."
        : "The samples couldn't be imported. Please try again.",
    };
  }
  await logAudit({
    action: "works.samples_imported",
    area: "works",
    summary: `Imported ${added} sample project${added === 1 ? "" : "s"}`,
    actor: a,
  });
  refresh();
  return { success: true, added };
}
