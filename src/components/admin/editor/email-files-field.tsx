"use client";

import { useState } from "react";
import { FileText, Info, Link2, Paperclip, X } from "lucide-react";
import {
  MAX_ATTACH_BYTES,
  fileMode,
  formatBytes,
  type EmailFile,
  type FileMode,
} from "@/lib/email-files";
import { Button } from "@/components/site/button";
import { SegmentedControl } from "@/components/admin/kit/inputs";
import { MediaPickerDialog } from "@/components/admin/media/media-picker";

/**
 * Files for an email: picked from the media library (or uploaded there).
 * Sent as real attachments when they're small enough, otherwise as
 * download links, and the reason is shown.
 */
export function EmailFilesField({
  files,
  onChange,
  mode,
  onModeChange,
  recipients,
}: {
  files: EmailFile[];
  onChange: (files: EmailFile[]) => void;
  mode: FileMode;
  onModeChange: (mode: FileMode) => void;
  /** How many people it goes to (big groups get links). */
  recipients: number;
}) {
  const [picking, setPicking] = useState(false);
  const decision = fileMode(mode, files, recipients);
  const total = files.reduce((n, f) => n + (f.bytes ?? 0), 0);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-bold">Files</span>
        <Button
          size="sm"
          variant="subtle"
          onClick={() => setPicking(true)}
          disabled={files.length >= 10}
        >
          <Paperclip aria-hidden className="size-4" /> Add files
        </Button>
      </div>

      {files.length === 0 ? (
        <p className="text-surface-muted text-xs">
          Optional. PDFs, documents, spreadsheets, images or a zip, from the
          media library (you can upload there too). Up to{" "}
          {formatBytes(MAX_ATTACH_BYTES)} attached; bigger files go as download
          links.
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-1.5">
            {files.map((f) => (
              <li
                key={f.id}
                className="bg-canvas flex items-center justify-between gap-3 rounded-[8px] px-3 py-2 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <FileText
                    aria-hidden
                    className="text-royal size-4 shrink-0"
                  />
                  <span className="truncate font-bold">{f.name}</span>
                  <span className="text-surface-muted shrink-0 text-xs">
                    {formatBytes(f.bytes)}
                  </span>
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${f.name}`}
                  onClick={() => onChange(files.filter((x) => x.id !== f.id))}
                  className="text-surface-muted inline-flex size-7 items-center justify-center rounded-full hover:bg-black/[0.06] hover:text-[#c2410c]"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SegmentedControl
              label="Send files as"
              hideLabel
              size="sm"
              value={mode}
              onChange={onModeChange}
              options={[
                {
                  value: "attach",
                  label: "Attachments",
                  icon: <Paperclip className="size-3.5" />,
                },
                {
                  value: "link",
                  label: "Download links",
                  icon: <Link2 className="size-3.5" />,
                },
              ]}
            />
            <span className="text-surface-muted text-xs">
              {files.length} file{files.length === 1 ? "" : "s"} ·{" "}
              {formatBytes(total)}
            </span>
          </div>
          {decision.reason ? (
            <p className="flex items-start gap-1.5 text-xs text-[#9a6700]">
              <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
              {decision.reason}
            </p>
          ) : (
            <p className="text-surface-muted text-xs">
              {decision.mode === "attach"
                ? "They arrive as attachments in the email."
                : "They arrive as download links under the message."}
            </p>
          )}
        </>
      )}

      <MediaPickerDialog
        open={picking}
        onOpenChange={setPicking}
        multiple
        title="Choose files to send"
        onSelect={(assets) => {
          const added = assets
            .filter((a) => !files.some((f) => f.id === a.id))
            .map((a) => ({
              id: a.id,
              name: a.fileName,
              url: a.url,
              bytes: a.bytes,
            }));
          onChange([...files, ...added].slice(0, 10));
        }}
      />
    </div>
  );
}
