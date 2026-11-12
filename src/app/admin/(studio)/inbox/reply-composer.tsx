"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { AlertTriangle, ChevronDown, Eye, Send } from "lucide-react";
import type { InboxItem } from "@/lib/inbox/inbox";
import type { EmailFile, FileMode } from "@/lib/email-files";
import { Button } from "@/components/site/button";
import { CheckboxField, TextField } from "@/components/admin/kit/fields";
import { Modal } from "@/components/admin/kit/overlays";
import { EmailEditor } from "@/components/admin/editor/email-editor";
import { EmailFilesField } from "@/components/admin/editor/email-files-field";
import { previewReply, sendReply, type ReplyInput } from "./actions";

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";
const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function replySubject(i: InboxItem) {
  if (i.source === "REGISTRATION") return `Your registration for ${i.subject}`;
  if (i.source === "APPLICATION")
    return `Your We Brand Schools application (${i.details.find((d) => d.label === "School")?.value ?? i.name})`;
  return "Re: your message to Dexta";
}

const sentAt = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * Write and send an email reply from the admin, with formatting and files.
 * It goes out from the site's email account, in the site's email design;
 * their reply comes back to the team's address. Past replies show above.
 */
export function ReplyComposer({
  item,
  meName,
  onSent,
}: {
  item: InboxItem;
  meName: string;
  onSent: (markDone: boolean) => void;
}) {
  const [subject, setSubject] = useState(replySubject(item));
  const [body, setBody] = useState(
    `<p>Hi ${escapeHtml(firstName(item.name))},</p><p></p><p>Best regards,<br>${escapeHtml(meName)}<br>Dexta Synergy Services</p>`,
  );
  const [files, setFiles] = useState<EmailFile[]>([]);
  const [mode, setMode] = useState<FileMode>("attach");
  const [quote, setQuote] = useState(item.source === "MESSAGE");
  const [markDone, setMarkDone] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);
  const [openReply, setOpenReply] = useState<string | null>(null);
  const [sending, start] = useTransition();
  const [previewing, startPreview] = useTransition();
  const input: ReplyInput = {
    subject,
    body,
    quote,
    markDone,
    fileIds: files.map((f) => f.id),
    fileMode: mode,
  };
  const hasWords = body.replace(/<[^>]+>/g, "").trim().length > 0;

  return (
    <section aria-label="Reply" className="flex flex-col gap-4">
      {item.replies.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold">
            Replies sent ({item.replies.length})
          </p>
          <ul className="flex flex-col gap-2">
            {item.replies.map((r) => (
              <li
                key={r.id}
                className="bg-canvas rounded-[10px] px-3.5 py-2.5 text-sm"
              >
                <button
                  type="button"
                  aria-expanded={openReply === r.id}
                  onClick={() => setOpenReply(openReply === r.id ? null : r.id)}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-bold">{r.subject}</span>
                    <span className="text-surface-muted text-xs">
                      {r.by} · {sentAt(r.sentAt)}
                      {r.files.length > 0 &&
                        ` · ${r.files.length} file${r.files.length === 1 ? "" : "s"}`}
                      {r.failed && (
                        <span className="ml-1 font-bold text-[#c2410c]">
                          · didn&apos;t send
                        </span>
                      )}
                    </span>
                  </span>
                  <ChevronDown
                    aria-hidden
                    className={`size-4 shrink-0 transition-transform ${openReply === r.id ? "rotate-180" : ""}`}
                  />
                </button>
                {openReply === r.id && (
                  <div className="mt-2 border-t border-black/[0.06] pt-2">
                    <div
                      className="[&_a]:text-royal [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
                      // Cleaned on the server (safeHtml) before it gets here.
                      dangerouslySetInnerHTML={{ __html: r.body }}
                    />
                    {r.files.length > 0 && (
                      <p className="text-surface-muted mt-2 text-xs">
                        Files:{" "}
                        {r.files.map((f, n) => (
                          <span key={f.url}>
                            {n > 0 && ", "}
                            <a
                              href={f.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline"
                            >
                              {f.name}
                            </a>
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-[12px] bg-white p-4 ring-1 ring-black/[0.08]">
        <p className="text-sm font-bold">
          Reply to {item.name}{" "}
          <span className="text-surface-muted font-normal">
            &lt;{item.email}&gt;
          </span>
        </p>
        <TextField
          label="Subject"
          maxLength={200}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <EmailEditor
          label="Message"
          value={body}
          onChange={setBody}
          minHeight="12rem"
        />
        <EmailFilesField
          files={files}
          onChange={setFiles}
          mode={mode}
          onModeChange={setMode}
          recipients={1}
        />
        <div className="flex flex-col gap-3">
          {item.original && (
            <CheckboxField
              label="Include their message below your reply"
              checked={quote}
              onCheckedChange={setQuote}
            />
          )}
          <CheckboxField
            label="Mark as done after sending"
            checked={markDone}
            onCheckedChange={setMarkDone}
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            size="sm"
            variant="subtle"
            disabled={previewing}
            onClick={() =>
              startPreview(async () => {
                const res = await previewReply(item.key, input);
                if (!res.success) return void toast.error(res.message);
                setPreview(res.html);
              })
            }
          >
            <Eye aria-hidden className="size-4" />
            {previewing ? "Preparing" : "Preview"}
          </Button>
          <Button
            size="sm"
            disabled={sending || !subject.trim() || !hasWords}
            onClick={() =>
              start(async () => {
                const res = await sendReply(item.key, input);
                if (!res.success) return void toast.error(res.message);
                toast.success(res.message ?? "Reply sent");
                onSent(markDone);
              })
            }
          >
            <Send aria-hidden className="size-4" />
            {sending ? "Sending" : "Send reply"}
          </Button>
        </div>
        <p className="text-surface-muted flex items-start gap-1.5 text-xs">
          <AlertTriangle aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          Sent from the site&apos;s email address. When they reply, it comes to
          the team inbox.
        </p>
      </div>

      <Modal
        open={preview !== null}
        onOpenChange={(o) => !o && setPreview(null)}
        title="How your reply will look"
        description={`To ${item.email} · ${subject}${files.length ? ` · ${files.length} file${files.length === 1 ? "" : "s"}` : ""}`}
        size="lg"
      >
        {preview && (
          <iframe
            title="Email preview"
            srcDoc={preview}
            sandbox=""
            className="h-[60dvh] w-full rounded-[10px] bg-white ring-1 ring-black/[0.06]"
          />
        )}
      </Modal>
    </section>
  );
}
