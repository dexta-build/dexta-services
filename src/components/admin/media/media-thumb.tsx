"use client";

import { Box, File, FileText, Film, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fileExtension,
  thumbnailUrl,
  type MediaAssetDTO,
  type MediaKind,
} from "@/lib/media/shared";

const ICONS: Record<MediaKind, typeof File> = {
  IMAGE: File,
  VIDEO: Film,
  DOCUMENT: FileText,
  AUDIO: Music,
  MODEL: Box,
  OTHER: File,
};

/**
 * Preview of a library item: the image (or video poster) when there is
 * one, otherwise an icon with the file extension.
 */
export function MediaThumb({
  asset,
  width = 480,
  fit = "auto",
  eager = false,
  className,
}: {
  asset: Pick<
    MediaAssetDTO,
    "kind" | "storage" | "key" | "posterKey" | "mimeType" | "fileName" | "alt"
  >;
  /** Requested image width in CSS pixels (doubled for sharp screens). */
  width?: number;
  /** "auto": logos and graphics are shown whole, photos fill the box. */
  fit?: "auto" | "cover" | "contain";
  /** Load straight away (previews in panels) instead of when scrolled to. */
  eager?: boolean;
  className?: string;
}) {
  const src = thumbnailUrl(asset, width * 2);
  const graphic =
    asset.mimeType === "image/svg+xml" ||
    asset.mimeType === "image/png" ||
    asset.mimeType === "image/gif";
  const contain = fit === "contain" || (fit === "auto" && graphic);
  const Icon = ICONS[asset.kind];

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        contain
          ? "bg-[length:16px_16px] bg-[linear-gradient(45deg,#efefea_25%,transparent_25%,transparent_75%,#efefea_75%),linear-gradient(45deg,#efefea_25%,transparent_25%,transparent_75%,#efefea_75%)] bg-[position:0_0,8px_8px] bg-white"
          : "bg-canvas",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- Cloudinary already resizes; any host
        <img
          src={src}
          alt={asset.alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className={cn(
            "size-full",
            contain ? "object-contain p-3" : "object-cover",
          )}
        />
      ) : (
        <span className="text-royal flex flex-col items-center gap-1.5">
          <Icon
            aria-hidden
            className={cn("opacity-80", width <= 96 ? "size-5" : "size-8")}
            strokeWidth={1.5}
          />
          {width > 96 && (
            <span className="text-[0.6875rem] font-bold tracking-[0.06em]">
              {fileExtension(asset.fileName)}
            </span>
          )}
        </span>
      )}
      {asset.kind === "VIDEO" && src && width > 96 && (
        <span
          aria-hidden
          className="absolute right-2 bottom-2 inline-flex size-7 items-center justify-center rounded-full bg-black/60 text-white"
        >
          <Film className="size-3.5" />
        </span>
      )}
    </div>
  );
}
