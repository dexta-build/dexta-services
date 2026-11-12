"use client";

import { useId, useState } from "react";
import { ImagePlus, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatBytes,
  KIND_LABELS,
  type MediaAssetDTO,
  type MediaKind,
} from "@/lib/media/shared";
import { Modal } from "@/components/admin/kit/overlays";
import { Button } from "@/components/site/button";
import { MediaBrowser } from "./media-browser";
import { MediaThumb } from "./media-thumb";

/**
 * Choose files from the library (or upload new ones) without leaving a
 * form. Opens as a large dialog; a bottom sheet on phones.
 */
export function MediaPickerDialog({
  open,
  onOpenChange,
  onSelect,
  kinds,
  multiple = false,
  title,
  canManage = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (assets: MediaAssetDTO[]) => void;
  kinds?: MediaKind[];
  multiple?: boolean;
  title?: string;
  /** Whether the user can edit the library (shows folder tools). */
  canManage?: boolean;
}) {
  const heading =
    title ??
    (kinds?.length === 1
      ? `Choose ${multiple ? `${KIND_LABELS[kinds[0]].toLowerCase()}s` : `${/^[aeiou]/i.test(KIND_LABELS[kinds[0]]) ? "an" : "a"} ${KIND_LABELS[kinds[0]].toLowerCase()}`}`
      : multiple
        ? "Choose files"
        : "Choose a file");
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={heading} size="xl">
      {open && (
        <MediaBrowser
          mode="pick"
          kinds={kinds}
          multiple={multiple}
          canManage={canManage}
          onCancel={() => onOpenChange(false)}
          onPick={(assets) => {
            onSelect(assets);
            onOpenChange(false);
          }}
        />
      )}
    </Modal>
  );
}

/**
 * A form field holding one library file: shows a preview with Change and
 * Remove, or a button to choose one. Store `mediaValue(asset)` (Cloudinary
 * public ID or R2 URL) or the asset ID, whichever the content needs.
 */
export function MediaField({
  label,
  value,
  onChange,
  kinds = ["IMAGE"],
  hint,
  error,
  required,
  aspect = "aspect-[16/10]",
}: {
  label: string;
  value: MediaAssetDTO | null;
  onChange: (asset: MediaAssetDTO | null) => void;
  kinds?: MediaKind[];
  hint?: React.ReactNode;
  error?: string;
  required?: boolean;
  /** Preview box shape, as a Tailwind aspect class. */
  aspect?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <p id={id} className="text-sm font-bold">
        {label}
        {required && (
          <span aria-hidden className="text-[#c2410c]">
            {" "}
            *
          </span>
        )}
      </p>
      {value ? (
        <div
          className={cn(
            "flex flex-col overflow-hidden rounded-[10px] bg-white ring-1 sm:flex-row",
            error ? "ring-[#c2410c]" : "ring-black/[0.08]",
          )}
        >
          <MediaThumb
            asset={value}
            width={360}
            className={cn("w-full sm:w-56 sm:shrink-0", aspect)}
          />
          <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">
                {value.title || value.fileName}
              </p>
              <p className="text-surface-muted text-xs">
                {KIND_LABELS[value.kind]} · {formatBytes(value.bytes)}
                {value.width && value.height
                  ? ` · ${value.width}×${value.height}`
                  : ""}
              </p>
              {value.kind === "IMAGE" && (
                <p
                  className={cn(
                    "mt-2 text-xs leading-relaxed",
                    value.alt
                      ? "text-surface-muted"
                      : "text-gold-deep font-bold",
                  )}
                >
                  {value.alt
                    ? `Alt: ${value.alt}`
                    : "No alt text. Add it in the media library."}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="subtle"
                onClick={() => setOpen(true)}
                aria-describedby={id}
              >
                <RefreshCw aria-hidden className="size-3.5" /> Change
              </Button>
              {!required && (
                <Button
                  size="sm"
                  variant="subtle"
                  onClick={() => onChange(null)}
                  aria-describedby={id}
                >
                  <X aria-hidden className="size-3.5" /> Remove
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-describedby={id}
          className={cn(
            "text-royal hover:bg-ice flex flex-col items-center justify-center gap-2 rounded-[10px] border-2 border-dashed bg-white px-6 py-8 text-sm font-bold transition-colors outline-none focus-visible:shadow-[0_0_0_3px_rgb(0_171_255/0.35)]",
            error ? "border-[#c2410c]" : "border-charcoal/[0.16]",
          )}
        >
          <ImagePlus aria-hidden className="size-6" />
          Choose from library or upload
        </button>
      )}
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
        kinds={kinds}
        onSelect={(a) => onChange(a[0] ?? null)}
      />
    </div>
  );
}
