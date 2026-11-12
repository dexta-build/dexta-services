"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, Mail, RotateCcw, Send, Users } from "lucide-react";
import {
  TAGS,
  checkAnnouncement,
  type AnnouncementInput,
  type RegStatus,
} from "@/lib/events/announcements";
import { cn } from "@/lib/utils";
import type { EmailFile, FileMode } from "@/lib/email-files";
import { EmailEditor } from "@/components/admin/editor/email-editor";
import { EmailFilesField } from "@/components/admin/editor/email-files-field";

const START_BODY = "<p>Hi {first_name},</p><p></p>";
import { Button } from "@/components/site/button";
import { AdminCard, StatusPill } from "@/components/admin/kit/layout";
import {
  CheckboxField,
  SelectField,
  SwitchField,
  TextField,
} from "@/components/admin/kit/fields";
import { SidePanel } from "@/components/admin/kit/side-panel";
import { useConfirm } from "@/components/admin/kit/feedback";
import {
  previewAnnouncement,
  resendFailed,
  sendAnnouncement,
  sendTest,
} from "./actions";

export type EventOption = {
  id: string;
  title: string;
  when: string;
  past: boolean;
};
export type Batch = {
  id: string;
  subject: string;
  body: string;
  eventId: string | null;
  sentAt: string;
  by: string;
  recipients: { email: string; name: string; failed: boolean; error: string }[];
  files: { name: string; url: string; mode: "attach" | "link" }[];
};
type Reg = {
  id: string;
  name: string;
  email: string;
  status: RegStatus;
  eventId: string;
};

const STATUS_LABEL: Record<RegStatus, string> = {
  ACCEPTED: "Accepted",
  PENDING: "Pending",
  DECLINED: "Declined",
};

const sentAt = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function MessagingView({
  events,
  registrations,
  history,
  meEmail,
}: {
  events: EventOption[];
  registrations: Reg[];
  history: Batch[];
  meEmail: string;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const upcoming = events.find((e) => !e.past) ?? events[0];
  const [eventId, setEventId] = useState(upcoming?.id ?? "all");
  const [statuses, setStatuses] = useState<RegStatus[]>(["ACCEPTED"]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState(START_BODY);
  const [editorKey, setEditorKey] = useState(0);
  const [files, setFiles] = useState<EmailFile[]>([]);
  const [fileModeWanted, setFileModeWanted] = useState<FileMode>("attach");
  const [includeEvent, setIncludeEvent] = useState(true);
  const [showList, setShowList] = useState(false);
  const [preview, setPreview] = useState("");
  const [openBatch, setOpenBatch] = useState<Batch | null>(null);
  const [sending, start] = useTransition();
  const [testing, startTest] = useTransition();

  const input: AnnouncementInput = {
    eventId,
    statuses,
    subject,
    body,
    includeEvent,
    fileIds: files.map((f) => f.id),
    fileMode: fileModeWanted,
  };

  // The same people the server will email: matching status, one per address.
  const recipients = useMemo(() => {
    const seen = new Set<string>();
    return registrations.filter((r) => {
      if (!statuses.includes(r.status)) return false;
      if (eventId !== "all" && r.eventId !== eventId) return false;
      const k = r.email.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [registrations, statuses, eventId]);

  const countFor = (s: RegStatus) =>
    registrations.filter(
      (r) => r.status === s && (eventId === "all" || r.eventId === eventId),
    ).length;

  // Live preview, a moment after typing stops.
  useEffect(() => {
    const t = setTimeout(async () => {
      const res = await previewAnnouncement(input);
      if (res.success) setPreview(res.html);
    }, 600);
    return () => clearTimeout(t);
  }, [
    eventId,
    statuses.join(),
    subject,
    body,
    includeEvent,
    files.map((f) => f.id).join(),
    fileModeWanted,
  ]);

  const problem = checkAnnouncement(input);
  const eventName = (id: string | null) =>
    id
      ? (events.find((e) => e.id === id)?.title ?? "A deleted event")
      : "Several events";

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <AdminCard title="Write the announcement">
          <div className="flex flex-col gap-5">
            <SelectField
              label="Event"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              options={[
                ...events.map((e) => ({
                  value: e.id,
                  label: `${e.title} · ${e.when}${e.past ? " (past)" : ""}`,
                })),
                { value: "all", label: "Everyone registered for any event" },
              ]}
            />
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-bold">Send to</legend>
              {(Object.keys(STATUS_LABEL) as RegStatus[]).map((s) => (
                <CheckboxField
                  key={s}
                  label={`${STATUS_LABEL[s]} (${countFor(s)})`}
                  checked={statuses.includes(s)}
                  onCheckedChange={(on) =>
                    setStatuses((list) =>
                      on ? [...list, s] : list.filter((x) => x !== s),
                    )
                  }
                />
              ))}
            </fieldset>

            <div className="bg-canvas rounded-[10px] px-4 py-3 text-sm">
              <button
                type="button"
                aria-expanded={showList}
                onClick={() => setShowList((v) => !v)}
                className="flex w-full items-center justify-between gap-3 text-left font-bold"
              >
                <span className="flex items-center gap-2">
                  <Users aria-hidden className="size-4" />
                  {recipients.length}{" "}
                  {recipients.length === 1 ? "person" : "people"} will get it
                </span>
                <ChevronDown
                  aria-hidden
                  className={cn(
                    "size-4 transition-transform",
                    showList && "rotate-180",
                  )}
                />
              </button>
              {showList && (
                <ul className="text-surface-muted mt-2 flex max-h-48 flex-col gap-1 overflow-y-auto">
                  {recipients.map((r) => (
                    <li key={r.id} className="truncate">
                      {r.name} · {r.email}
                    </li>
                  ))}
                  {recipients.length === 0 && <li>No one matches.</li>}
                </ul>
              )}
            </div>

            <TextField
              label="Subject"
              maxLength={200}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. See you tomorrow at {event}"
            />
            <EmailEditor
              key={editorKey}
              label="Message"
              value={body}
              onChange={setBody}
              tags={TAGS}
              placeholder="Write your announcement. Use the { } button to add each person's name or the event details."
            />
            <EmailFilesField
              files={files}
              onChange={setFiles}
              mode={fileModeWanted}
              onModeChange={setFileModeWanted}
              recipients={recipients.length}
            />
            <SwitchField
              label="Show the event under the message"
              description="Its name, date, place and a link to its page."
              checked={includeEvent}
              onCheckedChange={setIncludeEvent}
            />

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-black/[0.06] pt-4">
              <Button
                size="sm"
                variant="subtle"
                disabled={
                  testing ||
                  !!checkAnnouncement({ ...input, statuses: ["ACCEPTED"] })
                }
                onClick={() =>
                  startTest(async () => {
                    const res = await sendTest(input);
                    if (!res.success) return void toast.error(res.message);
                    toast.success(res.message);
                  })
                }
              >
                <Mail aria-hidden className="size-4" />
                {testing ? "Sending test" : `Send a test to ${meEmail}`}
              </Button>
              <Button
                size="sm"
                disabled={sending || !!problem || recipients.length === 0}
                onClick={async () => {
                  const ok = await confirm({
                    title: `Send to ${recipients.length} ${recipients.length === 1 ? "person" : "people"}?`,
                    description: `“${subject}” goes out now. This can't be undone.`,
                    confirmLabel: "Send now",
                  });
                  if (!ok) return;
                  start(async () => {
                    const res = await sendAnnouncement(input);
                    if (!res.success) return void toast.error(res.message);
                    toast.success(res.message, { duration: 8000 });
                    setSubject("");
                    setBody(START_BODY);
                    setFiles([]);
                    setEditorKey((k) => k + 1);
                    router.refresh();
                  });
                }}
              >
                <Send aria-hidden className="size-4" />
                {sending
                  ? "Sending"
                  : `Send to ${recipients.length} ${recipients.length === 1 ? "person" : "people"}`}
              </Button>
            </div>
          </div>
        </AdminCard>

        <div className="flex min-w-0 flex-col gap-2 xl:sticky xl:top-24 xl:self-start">
          <p className="text-sm font-bold">Preview</p>
          <p className="text-surface-muted -mt-1 text-xs">
            As the first person on the list will see it, with their details
            filled in.
          </p>
          <iframe
            title="Email preview"
            srcDoc={preview}
            sandbox=""
            className="h-[70dvh] w-full rounded-[12px] bg-white ring-1 ring-black/[0.08]"
          />
        </div>
      </div>

      <AdminCard
        title="Sent announcements"
        description="Newest first. Open one to see who got it."
      >
        {history.length === 0 ? (
          <p className="text-surface-muted text-sm">Nothing sent yet.</p>
        ) : (
          <ul className="flex flex-col">
            {history.map((b) => {
              const bad = b.recipients.filter((r) => r.failed).length;
              return (
                <li
                  key={b.id}
                  className="border-surface-rule border-b last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() => setOpenBatch(b)}
                    className="hover:bg-canvas -mx-2 flex w-[calc(100%+1rem)] flex-wrap items-center justify-between gap-3 rounded-[8px] px-2 py-3 text-left"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-bold">
                        {b.subject}
                      </span>
                      <span className="text-surface-muted text-xs">
                        {eventName(b.eventId)} · {b.by} · {sentAt(b.sentAt)}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <StatusPill tone="success">
                        {b.recipients.length - bad} sent
                      </StatusPill>
                      {bad > 0 && (
                        <StatusPill tone="danger">{bad} failed</StatusPill>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </AdminCard>

      <SidePanel
        open={!!openBatch}
        onOpenChange={(o) => !o && setOpenBatch(null)}
        title={openBatch?.subject ?? ""}
        description={
          openBatch
            ? `${eventName(openBatch.eventId)} · ${sentAt(openBatch.sentAt)} · by ${openBatch.by}`
            : ""
        }
        footer={
          openBatch && openBatch.recipients.some((r) => r.failed) ? (
            <Button
              size="sm"
              disabled={sending}
              onClick={() =>
                start(async () => {
                  const res = await resendFailed(openBatch.id);
                  if (!res.success) return void toast.error(res.message);
                  toast.success(res.message);
                  setOpenBatch(null);
                  router.refresh();
                })
              }
            >
              <RotateCcw aria-hidden className="size-4" /> Retry the failed ones
            </Button>
          ) : undefined
        }
      >
        {openBatch && (
          <div className="flex flex-col gap-5">
            <div
              className="bg-canvas rounded-[10px] p-4 text-sm [&_a]:text-royal [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
              // Cleaned on the server (safeHtml) before it gets here.
              dangerouslySetInnerHTML={{ __html: openBatch.body }}
            />
            {openBatch.files.length > 0 && (
              <p className="text-surface-muted text-xs">
                Files (
                {openBatch.files[0].mode === "link"
                  ? "download links"
                  : "attached"}
                ):{" "}
                {openBatch.files.map((f, n) => (
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
            <ul className="divide-surface-rule flex flex-col divide-y rounded-[10px] bg-white ring-1 ring-black/[0.06]">
              {openBatch.recipients.map((r) => (
                <li
                  key={r.email}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-bold">{r.name}</span>
                    <span className="text-surface-muted truncate text-xs">
                      {r.email}
                    </span>
                  </span>
                  {r.failed ? (
                    <StatusPill tone="danger">Failed</StatusPill>
                  ) : (
                    <StatusPill tone="success">Sent</StatusPill>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </SidePanel>
    </div>
  );
}
