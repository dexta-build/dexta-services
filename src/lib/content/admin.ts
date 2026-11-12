import "server-only";
import prisma from "@/lib/prisma";
import type { PageDef, SectionEnvelope } from "./define";
import { loadPage, resolveDefaults } from "./store";
import type { Field, Fields } from "./fields";
import { SITE_PAGE } from "./pages/site";
import { getFullCatalog } from "@/lib/services/catalog";

/** Fills `optionsFrom` selects with the current shared lists. */
async function withSharedOptions(fields: Fields): Promise<Fields> {
  let occasions: string[] | null = null;
  const getOccasions = async () => {
    if (!occasions) {
      const { data } = await loadPage(SITE_PAGE);
      occasions = data.taxonomy.occasions.filter(Boolean);
    }
    return occasions;
  };
  const walk = async (f: Field): Promise<Field> => {
    if (f.type === "select" && f.optionsFrom === "occasions") {
      const list = await getOccasions();
      return { ...f, options: list.map((o) => ({ value: o, label: o })) };
    }
    if (f.type === "select" && f.optionsFrom === "services") {
      const catalog = await getFullCatalog();
      return {
        ...f,
        options: catalog.flatMap((p) =>
          p.services
            .filter((sv) => !sv.externalHref)
            .map((sv) => ({
              value: `${p.key}/${sv.slug}`,
              label: sv.isVisible ? sv.title : `${sv.title} (hidden)`,
              group: p.key.toUpperCase(),
            })),
        ),
      };
    }
    if (f.type === "object" || f.type === "list") {
      const sub: Fields = {};
      for (const [k, v] of Object.entries(f.fields)) sub[k] = await walk(v);
      return { ...f, fields: sub };
    }
    return f;
  };
  const out: Fields = {};
  for (const [k, v] of Object.entries(fields)) out[k] = await walk(v);
  return out;
}

export type SectionStatus = "default" | "published" | "draft";

export type EditorSection = {
  key: string;
  label: string;
  description?: string;
  fields: Fields;
  canHide: boolean;
  /** What the form starts from: the draft, else published, else defaults. */
  current: SectionEnvelope;
  defaults: unknown;
  status: SectionStatus;
  publishedAt: string | null;
  publishedBy: string | null;
  updatedBy: string | null;
};

function envelope(v: unknown): SectionEnvelope | null {
  return v && typeof v === "object" && "data" in v
    ? (v as SectionEnvelope)
    : null;
}

/** A page's sections with their draft/published state, for the editor. */
export async function getEditorSections(
  def: PageDef,
): Promise<EditorSection[]> {
  const rows = await prisma.pageSection.findMany({ where: { page: def.key } });
  const byKey = new Map(rows.map((r) => [r.key, r]));
  return Promise.all(
    def.sections.map(async (s) => {
      const row = byKey.get(s.key);
      const defaults = await resolveDefaults(s);
      const draft = row?.hasDraft ? envelope(row.draft) : null;
      const published = envelope(row?.published);
      const base = draft ?? published;
      return {
        key: s.key,
        label: s.label,
        description: s.description,
        fields: await withSharedOptions(s.fields),
        canHide: s.canHide !== false,
        // Start from saved content merged over defaults so new fields appear.
        current: base
          ? {
              data: { ...(defaults as object), ...(base.data as object) },
              hidden: !!base.hidden,
            }
          : { data: defaults, hidden: false },
        defaults,
        status: draft ? "draft" : published ? "published" : "default",
        publishedAt: row?.publishedAt?.toISOString() ?? null,
        publishedBy: row?.publishedBy ?? null,
        updatedBy: row?.updatedBy ?? null,
      } satisfies EditorSection;
    }),
  );
}

export type PageSummary = {
  drafts: number;
  published: number;
  lastPublishedAt: string | null;
};

/** Per page: how many sections have unpublished changes. */
export async function getPageSummaries(): Promise<Record<string, PageSummary>> {
  try {
    const rows = await prisma.pageSection.findMany({
      select: {
        page: true,
        hasDraft: true,
        published: true,
        publishedAt: true,
      },
    });
    const out: Record<string, PageSummary> = {};
    for (const r of rows) {
      const s = (out[r.page] ??= {
        drafts: 0,
        published: 0,
        lastPublishedAt: null,
      });
      if (r.hasDraft) s.drafts++;
      if (r.published) s.published++;
      const at = r.publishedAt?.toISOString() ?? null;
      if (at && (!s.lastPublishedAt || at > s.lastPublishedAt))
        s.lastPublishedAt = at;
    }
    return out;
  } catch {
    return {};
  }
}
