"use client";

import { useId, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Drop files here, or tap to choose. Checks type and size before handing
 * files over; the upload itself is up to the caller (Cloudinary for
 * images, R2 for large files — see the media library).
 */
export function FileDropzone({
  onFiles,
  accept,
  multiple = false,
  maxSizeMB,
  label = "Drop files here or click to choose",
  description,
  disabled,
  onReject,
}: {
  onFiles: (files: globalThis.File[]) => void;
  /** e.g. "image/*" or "image/*,video/mp4,.pdf" */
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  label?: string;
  description?: React.ReactNode;
  disabled?: boolean;
  /** Told which files were turned away and why. */
  onReject?: (message: string) => void;
}) {
  const inputRef = useRef<React.ComponentRef<"input">>(null);
  const hintId = useId();
  const [over, setOver] = useState(false);

  const matches = (file: globalThis.File) => {
    if (!accept) return true;
    return accept.split(",").some((rule) => {
      const r = rule.trim().toLowerCase();
      if (r.startsWith(".")) return file.name.toLowerCase().endsWith(r);
      if (r.endsWith("/*")) return file.type.startsWith(r.slice(0, -1));
      return file.type === r;
    });
  };

  const take = (list: globalThis.FileList | null) => {
    if (!list) return;
    const files = Array.from(list).slice(0, multiple ? undefined : 1);
    const ok: globalThis.File[] = [];
    const rejected: string[] = [];
    for (const f of files) {
      if (!matches(f)) rejected.push(`${f.name} isn't an accepted file type`);
      else if (maxSizeMB && f.size > maxSizeMB * 1024 * 1024)
        rejected.push(`${f.name} is over ${maxSizeMB} MB`);
      else ok.push(f);
    }
    if (rejected.length) onReject?.(rejected.join(". ") + ".");
    if (ok.length) onFiles(ok);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (!disabled) take(e.dataTransfer.files);
      }}
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 rounded-[12px] border-2 border-dashed px-6 py-10 text-center transition-colors",
        over ? "border-royal bg-ice" : "border-charcoal/[0.16] bg-white",
        disabled && "opacity-50",
      )}
    >
      <span
        aria-hidden
        className="bg-ice text-royal inline-flex size-12 items-center justify-center rounded-full"
      >
        <UploadCloud className="size-6" />
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        aria-describedby={description ? hintId : undefined}
        className="text-royal text-[0.9375rem] font-bold after:absolute after:inset-0 after:rounded-[12px] after:content-[''] focus-visible:outline-none focus-visible:after:shadow-[0_0_0_3px_rgb(0_171_255/0.35)]"
      >
        {label}
      </button>
      {description && (
        <p
          id={hintId}
          className="text-surface-muted max-w-sm text-xs leading-relaxed"
        >
          {description}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={(e) => {
          take(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
