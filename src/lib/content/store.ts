import "server-only";
import { cache } from "react";
import { draftMode } from "next/headers";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import type {
  PageData,
  PageDef,
  SectionDef,
  SectionEnvelope,
  AnySections,
} from "./define";
import { mergeOver } from "./fields";

export const contentTag = (page: string) => `content:${page}`;

type Row = {
  key: string;
  draft: unknown;
  published: unknown;
  hasDraft: boolean;
};

async function readPublished(page: string): Promise<Row[]> {
  try {
    return await unstable_cache(
      () =>
        prisma.pageSection.findMany({
          where: { page },
          select: { key: true, published: true, draft: true, hasDraft: true },
        }),
      ["page-sections-v1", page],
      { revalidate: false, tags: [contentTag(page)] },
    )();
  } catch {
    // Table not created yet, or the database is unreachable: use defaults.
    // The failure isn't cached, so the next request tries again.
    return [];
  }
}

async function readDraft(page: string): Promise<Row[]> {
  try {
    return await prisma.pageSection.findMany({
      where: { page },
      select: { key: true, published: true, draft: true, hasDraft: true },
    });
  } catch {
    return [];
  }
}

export async function resolveDefaults<T>(
  def: SectionDef<string, T>,
): Promise<T> {
  return typeof def.defaults === "function"
    ? await (def.defaults as () => Promise<T>)()
    : def.defaults;
}

function isEnvelope(v: unknown): v is SectionEnvelope {
  return !!v && typeof v === "object" && "data" in v;
}

/** Is the visitor an admin previewing drafts? */
export const isPreviewing = cache(async () => {
  try {
    return (await draftMode()).isEnabled;
  } catch {
    return false;
  }
});

/**
 * Everything on a page: each section's content (published, or the draft
 * when an admin is previewing), with defaults filling any gaps, plus which
 * sections are hidden. Cached until the page is published again.
 */
export const loadPage = cache(async function loadPage<
  P extends PageDef<AnySections>,
>(
  def: P,
): Promise<{
  data: PageData<P>;
  hidden: Record<string, boolean>;
  preview: boolean;
}> {
  const preview = await isPreviewing();
  const rows = preview
    ? await readDraft(def.key)
    : await readPublished(def.key);
  const byKey = new Map(rows.map((r) => [r.key, r]));
  const data: Record<string, unknown> = {};
  const hidden: Record<string, boolean> = {};

  await Promise.all(
    def.sections.map(async (s) => {
      const row = byKey.get(s.key);
      const envelope = row
        ? preview && row.hasDraft
          ? row.draft
          : row.published
        : null;
      const defaults = await resolveDefaults(s);
      if (isEnvelope(envelope)) {
        data[s.key] = mergeOver(defaults, envelope.data);
        hidden[s.key] = s.canHide === false ? false : !!envelope.hidden;
      } else {
        data[s.key] = defaults;
        hidden[s.key] = false;
      }
    }),
  );
  return { data: data as PageData<P>, hidden, preview };
});
