"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, Loader2, OctagonX, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/media/shared";
import type { UploadItem } from "./use-media-upload";

/**
 * Progress for uploads in flight. A card in the corner on larger screens,
 * a bar across the bottom on phones. Collapsible; finished items can be
 * cleared.
 */
export function UploadTray({
  items,
  onCancel,
  onClear,
  inline = false,
}: {
  items: UploadItem[];
  onCancel: (id: string) => void;
  onClear: () => void;
  /** Render in the page flow (inside dialogs) instead of floating. */
  inline?: boolean;
}) {
  const [open, setOpen] = useState(true);
  if (items.length === 0) return null;
  const active = items.filter(
    (i) =>
      i.status === "waiting" ||
      i.status === "uploading" ||
      i.status === "saving",
  );
  const failed = items.filter((i) => i.status === "error").length;
  const done = items.filter((i) => i.status === "done").length;
  const headline = active.length
    ? `Uploading ${active.length} file${active.length === 1 ? "" : "s"}`
    : failed
      ? `${done} uploaded, ${failed} failed`
      : `${done} file${done === 1 ? "" : "s"} uploaded`;

  return (
    <section
      aria-label="Uploads"
      className={cn(
        "dx-site overflow-hidden bg-white",
        inline
          ? "rounded-[12px] ring-1 ring-black/[0.08]"
          : "fixed inset-x-0 bottom-0 z-[60] rounded-t-[16px] shadow-[0_-20px_50px_-20px_rgb(0_8_107/0.35)] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[24rem] sm:rounded-[14px] sm:shadow-[0_24px_60px_-20px_rgb(0_8_107/0.45)] sm:ring-1 sm:ring-black/[0.06]",
      )}
    >
      <header className="flex items-center gap-2 px-4 py-3">
        {active.length > 0 ? (
          <Loader2 aria-hidden className="text-royal size-4 animate-spin" />
        ) : failed ? (
          <OctagonX aria-hidden className="size-4 text-[#c2410c]" />
        ) : (
          <CheckCircle2 aria-hidden className="text-mint-deep size-4" />
        )}
        <p className="flex-1 text-sm font-bold" aria-live="polite">
          {headline}
        </p>
        {active.length === 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-surface-muted hover:text-surface-fg px-2 text-xs font-bold"
          >
            Clear
          </button>
        )}
        <button
          type="button"
          aria-label={open ? "Hide uploads" : "Show uploads"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="hover:bg-charcoal/[0.07] inline-flex size-8 items-center justify-center rounded-full"
        >
          <ChevronDown
            aria-hidden
            className={cn("size-4 transition-transform", !open && "rotate-180")}
          />
        </button>
      </header>
      {open && (
        <ul className="border-surface-rule max-h-[40dvh] overflow-y-auto border-t sm:max-h-72">
          {items.map((it) => (
            <li
              key={it.id}
              className="border-surface-rule flex items-center gap-3 border-b px-4 py-2.5 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{it.name}</p>
                {it.status === "error" ? (
                  <p className="text-xs text-[#c2410c]">{it.error}</p>
                ) : it.status === "cancelled" ? (
                  <p className="text-surface-muted text-xs">Cancelled</p>
                ) : it.status === "done" ? (
                  <p className="text-mint-deep text-xs font-bold">
                    Uploaded · {formatBytes(it.size)}
                  </p>
                ) : (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div
                      role="progressbar"
                      aria-label={`${it.name} upload progress`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(it.progress * 100)}
                      className="bg-charcoal/[0.08] h-1.5 flex-1 overflow-hidden rounded-full"
                    >
                      <div
                        className="bg-royal h-full rounded-full transition-[width] duration-200"
                        style={{ width: `${Math.max(4, it.progress * 100)}%` }}
                      />
                    </div>
                    <span className="text-surface-muted w-16 text-right text-xs tabular-nums">
                      {it.status === "waiting"
                        ? "Waiting"
                        : it.status === "saving"
                          ? "Saving"
                          : `${Math.round(it.progress * 100)}%`}
                    </span>
                  </div>
                )}
              </div>
              {(it.status === "waiting" || it.status === "uploading") && (
                <button
                  type="button"
                  aria-label={`Cancel ${it.name}`}
                  onClick={() => onCancel(it.id)}
                  className="text-surface-muted hover:bg-charcoal/[0.07] inline-flex size-8 shrink-0 items-center justify-center rounded-full"
                >
                  <X aria-hidden className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
