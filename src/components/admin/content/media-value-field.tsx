"use client";

import { useId, useState } from "react";
import { Box, FileText, ImagePlus, Link2, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { stock } from "@/lib/site/stock-media";
import { mediaValue } from "@/lib/media/shared";
import { Button } from "@/components/site/button";
import { TextField } from "@/components/admin/kit/fields";
import { MediaPickerDialog } from "@/components/admin/media/media-picker";

/** Older videos are stored as a Cloudinary ID rather than an address. */
function videoSrc(value: string) {
  if (/^(https?:)?\/\//i.test(value) || value.startsWith("/")) return value;
  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload/${value}`;
}

function describe(value: string) {
  if (!value) return "";
  if (/^\d{10,13}-[0-9a-f]{8,14}$/.test(value))
    return "Stock photo (placeholder)";
  if (value.startsWith("/")) return `Site file: ${value}`;
  if (/^https?:\/\//.test(value)) return value.replace(/^https?:\/\//, "");
  return `Media library: ${value.split("/").pop()}`;
}

/**
 * An image or video stored as a plain value: a media library item (its
 * Cloudinary ID, or URL for files on R2), a site path, or a web address.
 */
export function MediaValueField({
  label,
  value,
  onChange,
  kind = "IMAGE",
  hint,
  error,
  optional,
  compact,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  kind?: "IMAGE" | "VIDEO" | "DOCUMENT" | "MODEL";
  hint?: string;
  error?: string;
  optional?: boolean;
  /** Smaller tile for galleries and list items. */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState(false);
  const id = useId();
  const preview =
    value && kind !== "DOCUMENT" && kind !== "MODEL"
      ? kind === "VIDEO"
        ? videoSrc(value)
        : stock(value, 480)
      : "";
  // Older 3D model links look like /api/r2/models?key=folder/file.glb.
  const keyParam = /[?&]key=([^&]+)/.exec(value)?.[1];
  const fileName = value
    ? decodeURIComponent(
        (keyParam ?? value.split("?")[0]).split("/").pop() ?? "",
      )
    : "";

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      {label && (
        <p id={id} className="text-sm font-bold">
          {label}
        </p>
      )}
      <div
        className={cn(
          "flex overflow-hidden rounded-[10px] bg-white ring-1",
          compact ? "flex-col" : "flex-col sm:flex-row",
          error ? "ring-[#c2410c]" : "ring-black/[0.08]",
        )}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-describedby={label ? id : undefined}
          aria-label={
            value ? `Change ${label || "image"}` : `Choose ${label || "image"}`
          }
          className={cn(
            "bg-canvas relative flex shrink-0 items-center justify-center overflow-hidden outline-none focus-visible:shadow-[inset_0_0_0_3px_rgb(0_171_255/0.5)]",
            compact ? "aspect-[4/3] w-full" : "aspect-[4/3] w-full sm:w-44",
          )}
        >
          {kind === "DOCUMENT" || kind === "MODEL" ? (
            <span className="text-royal flex flex-col items-center gap-1.5 px-2 text-center text-xs font-bold">
              {kind === "MODEL" ? (
                <Box aria-hidden className="size-7" />
              ) : (
                <FileText aria-hidden className="size-7" />
              )}
              <span className="line-clamp-2 break-all">
                {value
                  ? fileName || "File"
                  : kind === "MODEL"
                    ? "Choose a 3D model"
                    : "Choose a file"}
              </span>
            </span>
          ) : preview ? (
            kind === "VIDEO" ? (
              <video
                src={preview}
                muted
                playsInline
                preload="metadata"
                className="size-full object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- previews from any host
              <img
                src={preview}
                alt=""
                className="size-full object-cover"
                loading="lazy"
              />
            )
          ) : (
            <span className="text-royal flex flex-col items-center gap-1.5 text-xs font-bold">
              <ImagePlus aria-hidden className="size-6" />
              Choose
            </span>
          )}
        </button>
        {!compact && (
          <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-3.5">
            <p className="text-surface-muted truncate text-xs">
              {value ? describe(value) : "Nothing chosen"}
            </p>
            {manual && (
              <TextField
                label="Web address or site path"
                value={value}
                onChange={(e) => onChange(e.target.value.trim())}
                placeholder="https://… or /images/…"
              />
            )}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="subtle" onClick={() => setOpen(true)}>
                <RefreshCw aria-hidden className="size-3.5" />{" "}
                {value ? "Change" : "Choose"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setManual((m) => !m)}
              >
                <Link2 aria-hidden className="size-3.5" />{" "}
                {manual ? "Done" : "Use a link"}
              </Button>
              {optional && value && (
                <Button size="sm" variant="ghost" onClick={() => onChange("")}>
                  <X aria-hidden className="size-3.5" /> Remove
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      {hint && !error && (
        <p className="text-surface-muted text-xs leading-relaxed">{hint}</p>
      )}
      {error && (
        <p role="alert" className="text-xs font-bold text-[#c2410c]">
          {error}
        </p>
      )}
      <MediaPickerDialog
        open={open}
        onOpenChange={setOpen}
        kinds={[kind]}
        onSelect={(assets) => {
          const a = assets[0];
          if (!a) return;
          // Videos, files and 3D models are stored as their full address so
          // players, viewers and download links can use them directly.
          onChange(kind === "IMAGE" ? mediaValue(a) : a.url);
        }}
      />
    </div>
  );
}
