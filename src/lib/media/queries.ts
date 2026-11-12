import "server-only";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import type { MediaAssetDTO, MediaFolderDTO, MediaKind } from "./shared";

export const PAGE_SIZE = 48;

export type MediaSort = "newest" | "oldest" | "name" | "largest";

export type MediaQuery = {
  q?: string;
  kinds?: MediaKind[];
  /** A folder ID, "none" for unfiled, or empty for all. */
  folderId?: string;
  needsAlt?: boolean;
  sort?: MediaSort;
  cursor?: string;
};

const include = { uploadedBy: { select: { name: true } } } as const;
type Row = Prisma.MediaAssetGetPayload<{ include: typeof include }>;

export function toDTO(a: Row): MediaAssetDTO {
  return {
    id: a.id,
    kind: a.kind,
    storage: a.storage,
    key: a.key,
    url: a.url,
    fileName: a.fileName,
    mimeType: a.mimeType,
    bytes: a.bytes,
    width: a.width,
    height: a.height,
    duration: a.duration,
    posterKey: a.posterKey,
    alt: a.alt,
    title: a.title,
    caption: a.caption,
    tags: a.tags,
    folderId: a.folderId,
    uploadedByName: a.uploadedBy?.name ?? null,
    createdAt: a.createdAt.toISOString(),
  };
}

export async function getAssetDTO(id: string) {
  const a = await prisma.mediaAsset.findUnique({ where: { id }, include });
  return a ? toDTO(a) : null;
}

const ORDER: Record<MediaSort, Prisma.MediaAssetOrderByWithRelationInput[]> = {
  newest: [{ createdAt: "desc" }, { id: "desc" }],
  oldest: [{ createdAt: "asc" }, { id: "asc" }],
  name: [{ fileName: "asc" }, { id: "asc" }],
  largest: [{ bytes: { sort: "desc", nulls: "last" } }, { id: "desc" }],
};

/** One page of the library, newest first by default. */
export async function queryMedia(query: MediaQuery) {
  const and: Prisma.MediaAssetWhereInput[] = [];
  const q = query.q?.trim();
  if (q) {
    and.push({
      OR: [
        { fileName: { contains: q, mode: "insensitive" } },
        { title: { contains: q, mode: "insensitive" } },
        { alt: { contains: q, mode: "insensitive" } },
        { tags: { has: q.toLowerCase() } },
      ],
    });
  }
  if (query.kinds?.length) and.push({ kind: { in: query.kinds } });
  if (query.folderId === "none") and.push({ folderId: null });
  else if (query.folderId) and.push({ folderId: query.folderId });
  if (query.needsAlt) and.push({ kind: "IMAGE", alt: "" });

  const rows = await prisma.mediaAsset.findMany({
    where: { AND: and },
    orderBy: ORDER[query.sort ?? "newest"],
    take: PAGE_SIZE + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    include,
  });
  const hasMore = rows.length > PAGE_SIZE;
  const items = rows.slice(0, PAGE_SIZE).map(toDTO);
  return { items, nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null };
}

export async function listFolders(): Promise<MediaFolderDTO[]> {
  const folders = await prisma.mediaFolder.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: { _count: { select: { assets: true } } },
  });
  return folders.map((f) => ({
    id: f.id,
    name: f.name,
    count: f._count.assets,
  }));
}

export async function libraryCounts() {
  const [total, unfiled, needsAlt] = await Promise.all([
    prisma.mediaAsset.count(),
    prisma.mediaAsset.count({ where: { folderId: null } }),
    prisma.mediaAsset.count({ where: { kind: "IMAGE", alt: "" } }),
  ]);
  return { total, unfiled, needsAlt };
}
