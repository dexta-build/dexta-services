/**
 * Media library helpers shared by server and browser code (no secrets).
 * Images go to Cloudinary; everything else goes to Cloudflare R2.
 */

export type MediaKind =
  | "IMAGE"
  | "VIDEO"
  | "DOCUMENT"
  | "AUDIO"
  | "MODEL"
  | "OTHER";
export type MediaStorage = "CLOUDINARY" | "R2";

/** A library item as sent to the browser. */
export type MediaAssetDTO = {
  id: string;
  kind: MediaKind;
  storage: MediaStorage;
  key: string;
  url: string;
  fileName: string;
  mimeType: string | null;
  bytes: number | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  posterKey: string | null;
  alt: string;
  title: string | null;
  caption: string | null;
  tags: string[];
  folderId: string | null;
  uploadedByName: string | null;
  createdAt: string;
};

export type MediaFolderDTO = { id: string; name: string; count: number };

export const KIND_LABELS: Record<MediaKind, string> = {
  IMAGE: "Image",
  VIDEO: "Video",
  DOCUMENT: "Document",
  AUDIO: "Audio",
  MODEL: "3D model",
  OTHER: "File",
};

/** Size limits per kind, in MB (Cloudinary's free plan caps images at 10 MB). */
export const MAX_MB: Record<MediaKind, number> = {
  IMAGE: 10,
  VIDEO: 500,
  DOCUMENT: 50,
  AUDIO: 100,
  MODEL: 50,
  OTHER: 50,
};

const DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
];
const DOCUMENT_EXT = /\.(pdf|docx?|pptx?|xlsx?|txt|csv)$/i;
const ARCHIVE_EXT = /\.(zip)$/i;

/** File types the library accepts, for <input accept>. */
export const ACCEPT_ALL =
  "image/*,video/mp4,video/webm,video/quicktime,audio/*,.glb,.gltf,.zip," +
  DOCUMENT_TYPES.join(",") +
  ",.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv";

export const ACCEPT_BY_KIND: Partial<Record<MediaKind, string>> = {
  IMAGE: "image/*",
  VIDEO: "video/mp4,video/webm,video/quicktime",
  DOCUMENT:
    DOCUMENT_TYPES.join(",") +
    ",.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv",
  AUDIO: "audio/*",
  MODEL: ".glb,.gltf",
};

/** What kind of media a file is, or null if the library doesn't take it. */
export function kindForFile(name: string, mime: string): MediaKind | null {
  const type = mime.toLowerCase();
  if (type.startsWith("image/")) return "IMAGE";
  if (type.startsWith("video/")) return "VIDEO";
  if (type.startsWith("audio/")) return "AUDIO";
  if (/\.(glb|gltf)$/i.test(name)) return "MODEL";
  if (DOCUMENT_TYPES.includes(type) || DOCUMENT_EXT.test(name))
    return "DOCUMENT";
  if (ARCHIVE_EXT.test(name)) return "OTHER";
  return null;
}

/** Images on Cloudinary, everything else on R2. */
export function storageForKind(kind: MediaKind): MediaStorage {
  return kind === "IMAGE" ? "CLOUDINARY" : "R2";
}

export function formatBytes(bytes: number | null | undefined) {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let n = bytes / 1024;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 ? 1 : 0)} ${units[i]}`;
}

export function formatDuration(seconds: number | null | undefined) {
  if (seconds == null || !Number.isFinite(seconds)) return "—";
  const s = Math.round(seconds);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export function fileExtension(name: string) {
  const m = name.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toUpperCase() : "";
}

function cloudName() {
  return process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() ?? "";
}

function cloudinaryImage(publicId: string, transform: string) {
  return `https://res.cloudinary.com/${cloudName()}/image/upload/${transform}/${publicId}`;
}

/**
 * A small preview image for a library item, or null when there is none
 * (documents, audio, R2 videos without a poster).
 */
export function thumbnailUrl(
  asset: Pick<
    MediaAssetDTO,
    "kind" | "storage" | "key" | "posterKey" | "mimeType"
  >,
  width = 480,
) {
  const w = Math.round(width);
  if (asset.kind === "IMAGE" && asset.storage === "CLOUDINARY") {
    // SVGs stay vector; everything else is resized and converted.
    if (asset.mimeType === "image/svg+xml")
      return cloudinaryImage(asset.key, "f_auto");
    return cloudinaryImage(asset.key, `c_limit,w_${w},f_auto,q_auto`);
  }
  if (asset.kind === "VIDEO") {
    if (asset.posterKey)
      return cloudinaryImage(asset.posterKey, `c_limit,w_${w},f_auto,q_auto`);
    if (asset.storage === "CLOUDINARY") {
      return `https://res.cloudinary.com/${cloudName()}/video/upload/so_0,c_limit,w_${w},q_auto,f_jpg/${asset.key}.jpg`;
    }
  }
  return null;
}

/**
 * The value most of the site stores for an image or video: the Cloudinary
 * public ID, or the full URL for files on R2.
 */
export function mediaValue(
  asset: Pick<MediaAssetDTO, "storage" | "key" | "url">,
) {
  return asset.storage === "CLOUDINARY" ? asset.key : asset.url;
}
