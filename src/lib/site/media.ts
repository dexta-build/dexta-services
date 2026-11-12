import { stock } from "./stock-media";
import type { MediaItem } from "@/components/site/media-asset";

const cloudName = () =>
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() ?? "";

function isUrlOrLocal(value: string) {
  return value.startsWith("/") || /^https?:\/\//.test(value);
}

/** Cloudinary (or local/absolute) image URL, cropped to fill w×h. */
export function imageUrl(publicId: string, width = 900, height?: number) {
  // Same resolver as stock(): stock photo IDs, site paths, URLs and
  // Cloudinary IDs (from the media library) all work.
  return stock(publicId, width, height);
}

export function videoUrl(publicId: string) {
  if (isUrlOrLocal(publicId)) return publicId;
  return `https://res.cloudinary.com/${cloudName()}/video/upload/q_auto,f_auto/${publicId}`;
}

/** First frame of a Cloudinary video as a JPG poster. */
export function videoPosterUrl(publicId: string, width = 900) {
  if (isUrlOrLocal(publicId)) return undefined;
  return `https://res.cloudinary.com/${cloudName()}/video/upload/so_0,c_fill,w_${width},q_auto,f_jpg/${publicId}.jpg`;
}

/** Builds a MediaItem for MediaAsset / MediaViewer from a stored asset. */
export function toMediaItem(
  publicId: string,
  kind: "IMAGE" | "VIDEO",
  alt: string,
  opts: { width?: number; height?: number; posterId?: string | null } = {},
): MediaItem {
  if (kind === "VIDEO") {
    return {
      kind: "video",
      src: videoUrl(publicId),
      poster: opts.posterId
        ? imageUrl(opts.posterId, opts.width ?? 900, opts.height)
        : videoPosterUrl(publicId, opts.width ?? 900),
      alt,
    };
  }
  return {
    kind: "image",
    src: imageUrl(publicId, opts.width ?? 900, opts.height),
    alt,
  };
}
