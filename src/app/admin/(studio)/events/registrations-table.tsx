"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Download, Mail, Trash2, UserX, Users } from "lucide-react";
import type { AdminRegistration, EventFieldsMap } from "@/lib/events/admin";
import { answerText } from "@/lib/events/fields";
import { Button } from "@/components/site/button";
import { StatusPill, type PillTone } from "@/components/admin/kit/layout";
import { DataTable, type Column } from "@/components/admin/kit/data-table";
import { SidePanel } from "@/components/admin/kit/side-panel";
import { Modal } from "@/components/admin/kit/overlays";
import { TextareaField } from "@/components/admin/kit/fields";
import { Callout } from "@/components/admin/kit/display";
import { useConfirm } from "@/components/admin/kit/feedback";
import {
  acceptRegistrations,
  declineRegistrations,
  deleteRegistrations,
} from "./actions";

const TONES: Record<AdminRegistration["status"], PillTone> = {
  PENDING: "warning",
  ACCEPTED: "success",
  DECLINED: "danger",
};
const WORDS: Record<AdminRegistration["status"], string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
};

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

type Result = { success: boolean; message?: string };

/**
 * Registrations with accept / decline (both email the person), delete
 * and CSV export. Click a row to read every answer.
 */
export function RegistrationsTable({
  registrations,
  fields,
  events,
  eventId,
}: {
  registrations: AdminRegistration[];
  fields: EventFieldsMap;
  events: { id: string; name: string }[];
  /** Set when showing one event's registrations. */
  eventId?: string;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [, start] = useTransition();
  const [open, setOpen] = useState<AdminRegistration | null>(null);
  const [declining, setDeclining] = useState<string[] | null>(null);

  const run = (fn: () => Promise<Result>, ok: string, after?: () => void) =>
    start(async () => {
      const res = await fn();
      if (!res.success)
        return void toast.error(res.message ?? "That didn't work.");
      toast.success(res.message ?? ok);
      after?.();
      router.refresh();
    });

  const accept = async (ids: string[]) => {
    const ok = await confirm({
      title: `Accept ${ids.length === 1 ? "this registration" : `${ids.length} registrations`}?`,
      description:
        "Each person gets an email confirming their seat. If the event reaches its limit, it closes and anyone still pending is told it's full.",
      confirmLabel: "Accept and email",
    });
    if (ok)
      run(
        () => acceptRegistrations(ids),
        "Accepted",
        () => setOpen(null),
      );
  };

  const exportHref = (ids?: string[]) => {
    const p = new URLSearchParams();
    if (eventId) p.set("event", eventId);
    if (ids?.length) p.set("ids", ids.join(","));
    return `/admin/registrations/export${p.size ? `?${p}` : ""}`;
  };

  const columns: Column<AdminRegistration>[] = [
    {
      key: "name",
      header: "Person",
      primary: true,
      sortValue: (r) => r.name.toLowerCase(),
      cell: (r) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-bold">{r.name}</span>
          <span className="text-surface-muted truncate text-xs">{r.email}</span>
        </span>
      ),
    },
    ...(eventId
      ? []
      : [
          {
            key: "event",
            header: "Event",
            sortValue: (r: AdminRegistration) => r.eventTitle,
            cell: (r: AdminRegistration) => r.eventTitle,
          },
        ]),
    {
      key: "status",
      header: "Status",
      sortValue: (r) => r.status,
      cell: (r) => (
        <StatusPill tone={TONES[r.status]} dot>
          {WORDS[r.status]}
        </StatusPill>
      ),
    },
    {
      key: "date",
      header: "Registered",
      hideBelow: "lg",
      sortValue: (r) => r.createdAt,
      cell: (r) => when(r.createdAt),
    },
  ];

  const pending = registrations.filter((r) => r.status === "PENDING").length;

  return (
    <div className="flex flex-col gap-5">
      {pending > 0 && (
        <Callout tone="warning" title={`${pending} waiting for a reply`}>
          Accept or decline them; each person is emailed either way.
        </Callout>
      )}
      <DataTable
        label="Registrations"
        rows={registrations}
        columns={columns}
        getRowId={(r) => r.id}
        rowLabel={(r) => r.name}
        searchText={(r) =>
          `${r.name} ${r.email} ${r.eventTitle} ${Object.values(r.answers).map(answerText).join(" ")}`
        }
        searchPlaceholder="Search by name, email or answer"
        onRowClick={setOpen}
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "PENDING", label: "Pending" },
              { value: "ACCEPTED", label: "Accepted" },
              { value: "DECLINED", label: "Declined" },
            ],
            match: (r, v) => r.status === v,
          },
          ...(!eventId && events.length > 1
            ? [
                {
                  key: "event",
                  label: "Event",
                  options: events.map((e) => ({ value: e.id, label: e.name })),
                  match: (r: AdminRegistration, v: string) => r.eventId === v,
                },
              ]
            : []),
        ]}
        bulkActions={[
          { label: "Accept", icon: <Check />, onClick: accept },
          {
            label: "Decline",
            icon: <UserX />,
            onClick: (ids) => setDeclining(ids),
          },
          {
            label: "Export",
            icon: <Download />,
            onClick: (ids) => {
              window.location.href = exportHref(ids);
            },
          },
          {
            label: "Delete",
            icon: <Trash2 />,
            danger: true,
            onClick: async (ids) => {
              const ok = await confirm({
                title: `Delete ${ids.length} registration${ids.length === 1 ? "" : "s"}?`,
                description: "No email is sent. This can't be undone.",
                confirmLabel: "Delete",
                danger: true,
              });
              if (ok) run(() => deleteRegistrations(ids), "Deleted");
            },
          },
        ]}
        rowActions={(r) => [
          {
            label: "View answers",
            icon: <Users />,
            onSelect: () => setOpen(r),
          },
          {
            label: "Accept",
            icon: <Check />,
            hidden: r.status !== "PENDING",
            onSelect: () => accept([r.id]),
          },
          {
            label: "Decline",
            icon: <UserX />,
            hidden: r.status !== "PENDING",
            onSelect: () => setDeclining([r.id]),
          },
          {
            label: "Email",
            icon: <Mail />,
            href: `mailto:${r.email}`,
            external: true,
          },
          "separator",
          {
            label: "Delete",
            icon: <Trash2 />,
            danger: true,
            onSelect: async () => {
              const ok = await confirm({
                title: `Delete ${r.name}'s registration?`,
                description: "No email is sent. This can't be undone.",
                confirmLabel: "Delete",
                danger: true,
              });
              if (ok) run(() => deleteRegistrations([r.id]), "Deleted");
            },
          },
        ]}
        toolbar={
          registrations.length > 0 ? (
            <Button size="sm" variant="subtle" href={exportHref()}>
              <Download aria-hidden className="size-4" /> Export CSV
            </Button>
          ) : undefined
        }
        empty={{
          icon: <Users />,
          title: registrations.length
            ? "No registrations match"
            : "No registrations yet",
          description: registrations.length
            ? "Try another search or filter."
            : "They appear here as people sign up on the event page.",
        }}
      />

      <SidePanel
        open={!!open}
        onOpenChange={(o) => !o && setOpen(null)}
        title={open?.name ?? ""}
        description={
          open ? `${open.eventTitle} · registered ${when(open.createdAt)}` : ""
        }
        footer={
          open?.status === "PENDING" ? (
            <>
              <Button
                size="sm"
                variant="subtle"
                onClick={() => setDeclining([open.id])}
              >
                Decline
              </Button>
              <Button size="sm" onClick={() => accept([open.id])}>
                Accept
              </Button>
            </>
          ) : (
            <Button size="sm" variant="subtle" onClick={() => setOpen(null)}>
              Close
            </Button>
          )
        }
      >
        {open && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone={TONES[open.status]} dot>
                {WORDS[open.status]}
              </StatusPill>
              {open.status === "DECLINED" && open.declineReason && (
                <span className="text-surface-muted text-sm">
                  Reason: {open.declineReason}
                </span>
              )}
            </div>
            <dl className="divide-surface-rule flex flex-col divide-y rounded-[10px] bg-white ring-1 ring-black/[0.06]">
              <Answer label="Email">
                <a href={`mailto:${open.email}`} className="underline">
                  {open.email}
                </a>
              </Answer>
              {(fields[open.eventId] ?? []).map((f) => (
                <Answer key={f.name} label={f.label}>
                  {answerText(open.answers[f.name]) || (
                    <span className="text-surface-muted">No answer</span>
                  )}
                </Answer>
              ))}
              {/* Answers to questions removed since they registered. */}
              {Object.entries(open.answers)
                .filter(
                  ([k]) =>
                    !(fields[open.eventId] ?? []).some((f) => f.name === k),
                )
                .map(([k, v]) => (
                  <Answer
                    key={k}
                    label={`${k.replace(/_/g, " ")} (old question)`}
                  >
                    {answerText(v) || "—"}
                  </Answer>
                ))}
            </dl>
          </div>
        )}
      </SidePanel>

      {declining && (
        <DeclineDialog
          count={declining.length}
          onClose={() => setDeclining(null)}
          onConfirm={(reason) =>
            run(
              () => declineRegistrations(declining, reason),
              "Declined",
              () => {
                setDeclining(null);
                setOpen(null);
              },
            )
          }
        />
      )}
    </div>
  );
}

function Answer({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3">
      <dt className="text-surface-muted text-xs font-bold">{label}</dt>
      <dd className="text-sm break-words whitespace-pre-line">{children}</dd>
    </div>
  );
}

function DeclineDialog({
  count,
  onClose,
  onConfirm,
}: {
  count: number;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title={`Decline ${count === 1 ? "this registration" : `${count} registrations`}?`}
      description="Each person gets a polite email. The reason, if you add one, is included."
      footer={
        <>
          <Button size="sm" variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" variant="danger" onClick={() => onConfirm(reason)}>
            Decline and email
          </Button>
        </>
      }
    >
      <TextareaField
        label="Reason (optional)"
        rows={3}
        maxLength={500}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="e.g. This session is for students only."
      />
    </Modal>
  );
}
