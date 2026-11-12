"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/admin/audit";
import {
  AdminAuthError,
  requireAdmin,
  requireOwner,
  type AdminActor,
} from "@/lib/admin/session";
import {
  destroyCloudinary,
  resourcesByIds,
  type CloudinaryListed,
  POSTER_FOLDER,
  signImageUpload,
  verifyUploadResponse,
  LIBRARY_FOLDER,
} from "@/lib/media/cloudinary";
import {
  deleteObject,
  getBucketCors,
  headObject,
  newObjectKey,
  presignPut,
  publicUrlFor,
} from "@/lib/media/r2";
import {
  getAssetDTO,
  listFolders,
  libraryCounts,
  queryMedia,
  type MediaQuery,
} from "@/lib/media/queries";
import {
  kindForFile,
  MAX_MB,
  storageForKind,
  type MediaAssetDTO,
  type MediaKind,
} from "@/lib/media/shared";
import {
  collectSiteCloudinaryIds,
  findUsage,
  type MediaUsage,
} from "@/lib/media/usage";

type Fail = { success: false; message: string };
type Ok<T = object> = { success: true } & T;

async function actor(area: "media" | null): Promise<AdminActor | Fail> {
  try {
    return await requireAdmin(area);
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof AdminAuthError && error.status === 403
          ? "You don't have access to manage the media library."
          : "Your session has ended. Sign in again.",
    };
  }
}
const failed = (v: AdminActor | Fail): v is Fail => "success" in v;

const refresh = () => revalidatePath("/admin/media");

/* ── Browsing (anyone signed in: pickers in every area use it) ──────────── */

const kindEnum = z.enum([
  "IMAGE",
  "VIDEO",
  "DOCUMENT",
  "AUDIO",
  "MODEL",
  "OTHER",
]);
const querySchema = z.object({
  q: z.string().max(100).optional(),
  kinds: z.array(kindEnum).optional(),
  folderId: z.string().max(64).optional(),
  needsAlt: z.boolean().optional(),
  sort: z.enum(["newest", "oldest", "name", "largest"]).optional(),
  cursor: z.string().max(64).optional(),
});

export async function listMedia(query: MediaQuery) {
  const a = await actor(null);
  if (failed(a)) return a;
  const parsed = querySchema.safeParse(query);
  if (!parsed.success)
    return { success: false as const, message: "Invalid filters." };
  const page = await queryMedia(parsed.data);
  return { success: true as const, ...page };
}

export async function getMediaFolders() {
  const a = await actor(null);
  if (failed(a)) return a;
  const [folders, counts] = await Promise.all([listFolders(), libraryCounts()]);
  return { success: true as const, folders, counts };
}

/* ── Uploading ───────────────────────────────────────────────────────────── */

const prepareSchema = z.object({
  fileName: z.string().min(1).max(200),
  mimeType: z.string().max(120),
  bytes: z.number().int().positive(),
  /** A video poster frame, not a library item of its own. */
  purpose: z.enum(["library", "poster"]).default("library"),
});

export type PreparedUpload =
  | {
      storage: "CLOUDINARY";
      kind: MediaKind;
      uploadUrl: string;
      fields: Record<string, string>;
    }
  | { storage: "R2"; kind: MediaKind; uploadUrl: string; key: string };

/** Checks the file and returns where (and how) the browser should send it. */
export async function prepareUpload(
  input: z.input<typeof prepareSchema>,
): Promise<Ok<{ upload: PreparedUpload }> | Fail> {
  const a = await actor(null);
  if (failed(a)) return a;
  const parsed = prepareSchema.safeParse(input);
  if (!parsed.success)
    return { success: false, message: "That file can't be uploaded." };
  const { fileName, mimeType, bytes, purpose } = parsed.data;

  const kind = purpose === "poster" ? "IMAGE" : kindForFile(fileName, mimeType);
  if (!kind)
    return {
      success: false,
      message: `${fileName} isn't a file type the library accepts.`,
    };
  if (bytes > MAX_MB[kind] * 1024 * 1024) {
    return {
      success: false,
      message: `${fileName} is over the ${MAX_MB[kind]} MB limit for this type of file.`,
    };
  }

  try {
    if (storageForKind(kind) === "CLOUDINARY") {
      const signed = signImageUpload(
        purpose === "poster" ? POSTER_FOLDER : LIBRARY_FOLDER,
      );
      return {
        success: true,
        upload: { storage: "CLOUDINARY", kind, ...signed },
      };
    }
    const key = newObjectKey(fileName);
    return {
      success: true,
      upload: { storage: "R2", kind, key, uploadUrl: presignPut(key) },
    };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

const completeSchema = z.object({
  storage: z.enum(["CLOUDINARY", "R2"]),
  kind: kindEnum,
  fileName: z.string().min(1).max(200),
  mimeType: z.string().max(120).nullable(),
  bytes: z.number().int().nullable(),
  width: z.number().int().nullable().optional(),
  height: z.number().int().nullable().optional(),
  duration: z.number().nullable().optional(),
  posterKey: z.string().max(300).nullable().optional(),
  folderId: z.string().max(64).nullable().optional(),
  alt: z.string().max(300).optional(),
  // R2
  key: z.string().max(400).optional(),
  // Cloudinary upload response
  publicId: z.string().max(300).optional(),
  version: z.union([z.number(), z.string()]).optional(),
  signature: z.string().max(100).optional(),
  secureUrl: z.string().url().optional(),
});

/** Records a finished upload after checking it really reached storage. */
export async function completeUpload(
  input: z.input<typeof completeSchema>,
): Promise<Ok<{ asset: MediaAssetDTO }> | Fail> {
  const a = await actor(null);
  if (failed(a)) return a;
  const parsed = completeSchema.safeParse(input);
  if (!parsed.success)
    return { success: false, message: "The upload couldn't be saved." };
  const d = parsed.data;

  let key: string;
  let url: string;
  let bytes = d.bytes;
  let mimeType = d.mimeType;

  if (d.storage === "CLOUDINARY") {
    if (!d.publicId || d.version == null || !d.signature || !d.secureUrl) {
      return { success: false, message: "The upload response was incomplete." };
    }
    if (!verifyUploadResponse(d.publicId, d.version, d.signature)) {
      return {
        success: false,
        message: "We couldn't confirm that upload with Cloudinary.",
      };
    }
    key = d.publicId;
    url = d.secureUrl;
  } else {
    if (!d.key || !d.key.startsWith("media/") || d.key.includes("..")) {
      return { success: false, message: "Invalid file key." };
    }
    const head = await headObject(d.key).catch(() => null);
    if (!head)
      return {
        success: false,
        message: "The file didn't reach storage. Please try again.",
      };
    key = d.key;
    url = publicUrlFor(d.key);
    bytes = head.bytes ?? bytes;
    mimeType = head.contentType ?? mimeType;
  }

  const folderId =
    d.folderId &&
    (await prisma.mediaFolder.findUnique({
      where: { id: d.folderId },
      select: { id: true },
    }))
      ? d.folderId
      : null;

  const created = await prisma.mediaAsset.create({
    data: {
      kind: d.kind,
      storage: d.storage,
      key,
      url,
      fileName: d.fileName,
      mimeType,
      bytes,
      width: d.width ?? null,
      height: d.height ?? null,
      duration: d.duration ?? null,
      posterKey: d.posterKey ?? null,
      alt: d.alt?.trim() ?? "",
      folderId,
      uploadedById: a.id,
    },
  });
  await logAudit({
    action: "media.upload",
    area: "media",
    summary: `Uploaded ${d.fileName}`,
    entityType: "MediaAsset",
    entityId: created.id,
    actor: a,
  });
  refresh();
  const asset = await getAssetDTO(created.id);
  return { success: true, asset: asset! };
}

/**
 * Is the R2 bucket set up to accept uploads from this site? `ready` is null
 * when the access key can't read bucket settings (then we only find out
 * when an upload is refused).
 */
export async function checkLargeFileStorage(origin: string) {
  const a = await actor("media");
  if (failed(a)) return a;
  try {
    const cors = await getBucketCors();
    if (!cors.readable) return { success: true as const, ready: null };
    if (!cors.xml) return { success: true as const, ready: false };
    const allowsPut = /<AllowedMethod>\s*PUT\s*<\/AllowedMethod>/i.test(
      cors.xml,
    );
    const allowsOrigin =
      cors.xml.includes(`<AllowedOrigin>${origin}</AllowedOrigin>`) ||
      /<AllowedOrigin>\*<\/AllowedOrigin>/.test(cors.xml);
    return { success: true as const, ready: allowsPut && allowsOrigin };
  } catch {
    return { success: true as const, ready: null };
  }
}

/* ── Details ─────────────────────────────────────────────────────────────── */

export async function getMediaUsage(
  id: string,
): Promise<Ok<{ usage: MediaUsage[] }> | Fail> {
  const a = await actor(null);
  if (failed(a)) return a;
  const asset = await prisma.mediaAsset.findUnique({
    where: { id },
    select: { key: true, url: true },
  });
  if (!asset) return { success: false, message: "That file no longer exists." };
  return { success: true, usage: await findUsage([asset.key, asset.url]) };
}

const updateSchema = z.object({
  alt: z.string().max(300),
  title: z.string().max(200).nullable(),
  caption: z.string().max(1000).nullable(),
  tags: z.array(z.string().trim().toLowerCase().min(1).max(40)).max(30),
  folderId: z.string().max(64).nullable(),
});

export async function updateMedia(
  id: string,
  input: z.input<typeof updateSchema>,
): Promise<Ok<{ asset: MediaAssetDTO }> | Fail> {
  const a = await actor("media");
  if (failed(a)) return a;
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success)
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid details.",
    };
  const d = parsed.data;
  const updated = await prisma.mediaAsset.update({
    where: { id },
    data: {
      alt: d.alt.trim(),
      title: d.title?.trim() || null,
      caption: d.caption?.trim() || null,
      tags: [...new Set(d.tags)],
      folderId: d.folderId || null,
    },
  });
  await logAudit({
    action: "media.update",
    area: "media",
    summary: `Edited details of ${updated.fileName}`,
    entityType: "MediaAsset",
    entityId: id,
    actor: a,
  });
  refresh();
  return { success: true, asset: (await getAssetDTO(id))! };
}

/** Sets alt text only. Allowed for anyone signed in (used right after uploading in a picker). */
export async function setMediaAlt(id: string, alt: string): Promise<Ok | Fail> {
  const a = await actor(null);
  if (failed(a)) return a;
  const value = z.string().max(300).safeParse(alt);
  if (!value.success)
    return { success: false, message: "Alt text is too long." };
  const asset = await prisma.mediaAsset.findUnique({
    where: { id },
    select: { uploadedById: true, fileName: true },
  });
  if (!asset) return { success: false, message: "That file no longer exists." };
  // Editors without library access may only describe their own uploads.
  if (asset.uploadedById !== a.id) {
    const m = await actor("media");
    if (failed(m)) return m;
  }
  await prisma.mediaAsset.update({
    where: { id },
    data: { alt: value.data.trim() },
  });
  refresh();
  return { success: true };
}

export async function moveMedia(
  ids: string[],
  folderId: string | null,
): Promise<Ok | Fail> {
  const a = await actor("media");
  if (failed(a)) return a;
  if (!ids.length) return { success: true };
  await prisma.mediaAsset.updateMany({
    where: { id: { in: ids } },
    data: { folderId },
  });
  const folder = folderId
    ? await prisma.mediaFolder.findUnique({ where: { id: folderId } })
    : null;
  await logAudit({
    action: "media.move",
    area: "media",
    summary: `Moved ${ids.length} file${ids.length === 1 ? "" : "s"} to ${folder?.name ?? "Unfiled"}`,
    metadata: { ids },
    actor: a,
  });
  refresh();
  return { success: true };
}

export type DeleteResult =
  | Ok<{ deleted: number }>
  | Fail
  | {
      success: false;
      message: string;
      inUse: { id: string; fileName: string; usage: MediaUsage[] }[];
    };

/**
 * Deletes files from storage and the library. Unless `force` is set, files
 * still used on the site are kept and listed so the user can decide.
 */
export async function deleteMedia(
  ids: string[],
  force = false,
): Promise<DeleteResult> {
  const a = await actor("media");
  if (failed(a)) return a;
  const assets = await prisma.mediaAsset.findMany({
    where: { id: { in: ids } },
  });
  if (!assets.length) return { success: true, deleted: 0 };

  if (!force) {
    const checks = await Promise.all(
      assets.map(async (x) => ({
        id: x.id,
        fileName: x.fileName,
        usage: await findUsage([x.key, x.url]),
      })),
    );
    const inUse = checks.filter((c) => c.usage.length > 0);
    if (inUse.length) {
      return {
        success: false,
        message:
          inUse.length === 1
            ? `${inUse[0].fileName} is still used on the site.`
            : `${inUse.length} of these files are still used on the site.`,
        inUse,
      };
    }
  }

  let deleted = 0;
  const problems: string[] = [];
  for (const x of assets) {
    const removed =
      x.storage === "CLOUDINARY"
        ? await destroyCloudinary(x.key, x.kind === "VIDEO" ? "video" : "image")
        : await deleteObject(x.key).catch(() => false);
    if (!removed) {
      problems.push(x.fileName);
      continue;
    }
    if (x.posterKey) await destroyCloudinary(x.posterKey, "image");
    await prisma.mediaAsset.delete({ where: { id: x.id } });
    deleted++;
  }
  await logAudit({
    action: "media.delete",
    area: "media",
    summary:
      deleted === 1 && assets.length === 1
        ? `Deleted ${assets[0].fileName}${force ? " (while in use)" : ""}`
        : `Deleted ${deleted} file${deleted === 1 ? "" : "s"}${force ? " (some in use)" : ""}`,
    metadata: { ids, force, failed: problems },
    actor: a,
  });
  refresh();
  if (problems.length) {
    return {
      success: false,
      message: `Couldn't remove ${problems.join(", ")} from storage. Try again.`,
    };
  }
  return { success: true, deleted };
}

/* ── Folders ─────────────────────────────────────────────────────────────── */

const folderName = z.string().trim().min(1, "Give the folder a name.").max(60);

export async function createFolder(
  name: string,
): Promise<Ok<{ id: string }> | Fail> {
  const a = await actor("media");
  if (failed(a)) return a;
  const parsed = folderName.safeParse(name);
  if (!parsed.success)
    return { success: false, message: parsed.error.issues[0].message };
  const count = await prisma.mediaFolder.count();
  const folder = await prisma.mediaFolder.create({
    data: { name: parsed.data, position: count },
  });
  await logAudit({
    action: "media.folder_created",
    area: "media",
    summary: `Created folder ${parsed.data}`,
    entityType: "MediaFolder",
    entityId: folder.id,
    actor: a,
  });
  refresh();
  return { success: true, id: folder.id };
}

export async function renameFolder(
  id: string,
  name: string,
): Promise<Ok | Fail> {
  const a = await actor("media");
  if (failed(a)) return a;
  const parsed = folderName.safeParse(name);
  if (!parsed.success)
    return { success: false, message: parsed.error.issues[0].message };
  await prisma.mediaFolder.update({
    where: { id },
    data: { name: parsed.data },
  });
  await logAudit({
    action: "media.folder_renamed",
    area: "media",
    summary: `Renamed a folder to ${parsed.data}`,
    entityType: "MediaFolder",
    entityId: id,
    actor: a,
  });
  refresh();
  return { success: true };
}

/** Removes the folder; its files stay in the library as Unfiled. */
export async function deleteFolder(id: string): Promise<Ok | Fail> {
  const a = await actor("media");
  if (failed(a)) return a;
  const folder = await prisma.mediaFolder.delete({ where: { id } });
  await logAudit({
    action: "media.folder_deleted",
    area: "media",
    summary: `Deleted folder ${folder.name}`,
    entityType: "MediaFolder",
    entityId: id,
    actor: a,
  });
  refresh();
  return { success: true };
}

/* ── Import this site's existing Cloudinary files (Admins) ──────────────── */

/**
 * Adds the Cloudinary images and videos that this site's pages already use
 * (uploaded by the old admin) to the library. Only files referenced by this
 * site's content are looked up, so other projects sharing the Cloudinary
 * account are never listed or touched.
 */
export async function importFromCloudinary(): Promise<
  Ok<{ added: number; skipped: number; missing: number }> | Fail
> {
  let a: AdminActor;
  try {
    a = await requireOwner();
  } catch {
    return { success: false, message: "Only Admins can import files." };
  }
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  if (!cloudName)
    return { success: false, message: "Cloudinary isn't set up." };

  let added = 0;
  let skipped = 0;
  let missing = 0;
  try {
    const referenced = await collectSiteCloudinaryIds(cloudName);
    const existing = new Set(
      (
        await prisma.mediaAsset.findMany({
          where: { key: { in: referenced } },
          select: { key: true },
        })
      ).map((r) => r.key),
    );
    skipped = existing.size;
    let pending = referenced.filter((id) => !existing.has(id));

    for (const type of ["image", "video"] as const) {
      const found: CloudinaryListed[] = [];
      for (let i = 0; i < pending.length; i += 100) {
        found.push(...(await resourcesByIds(pending.slice(i, i + 100), type)));
      }
      if (found.length) {
        const result = await prisma.mediaAsset.createMany({
          data: found.map((r) => ({
            kind: type === "image" ? ("IMAGE" as const) : ("VIDEO" as const),
            storage: "CLOUDINARY" as const,
            key: r.public_id,
            url: r.secure_url,
            fileName: `${r.public_id.split("/").pop()}${r.format ? `.${r.format}` : ""}`,
            mimeType: r.format
              ? `${type}/${r.format === "jpg" ? "jpeg" : r.format === "svg" ? "svg+xml" : r.format}`
              : null,
            bytes: r.bytes ?? null,
            width: r.width ?? null,
            height: r.height ?? null,
            duration: r.duration ?? null,
            createdAt: new Date(r.created_at),
          })),
          skipDuplicates: true,
        });
        added += result.count;
      }
      const got = new Set(found.map((r) => r.public_id));
      pending = pending.filter((id) => !got.has(id));
    }
    // Referenced on the site but not on this Cloudinary account (old or
    // broken references). Extension-less duplicates are counted once.
    missing = new Set(pending.map((id) => id.replace(/\.[a-z0-9]{2,5}$/i, "")))
      .size;
  } catch (error) {
    console.error("[media] import failed:", (error as Error).message);
    return {
      success: false,
      message: `Import stopped: ${(error as Error).message}`,
    };
  }

  await logAudit({
    action: "media.import",
    area: "media",
    summary: `Imported ${added} file${added === 1 ? "" : "s"} this site uses from Cloudinary`,
    metadata: { added, skipped, missing },
    actor: a,
  });
  refresh();
  return { success: true, added, skipped, missing };
}
