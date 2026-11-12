"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCheck,
  Download,
  ExternalLink,
  Inbox as InboxIcon,
  Mail,
  MailOpen,
  MessageCircle,
  RotateCcw,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { InboxAccess, InboxItem, InboxSourceKey } from "@/lib/inbox/inbox";
import { Button } from "@/components/site/button";
import { StatusPill, type PillTone } from "@/components/admin/kit/layout";
import { DataTable, type Column } from "@/components/admin/kit/data-table";
import { SidePanel } from "@/components/admin/kit/side-panel";
import { Modal } from "@/components/admin/kit/overlays";
import { SelectField } from "@/components/admin/kit/fields";
import { SegmentedControl } from "@/components/admin/kit/inputs";
import { Avatar } from "@/components/admin/kit/display";
import { assign, markOpened, setDone, setRead } from "./actions";
import { ReplyComposer } from "./reply-composer";

type Person = { id: string; name: string; email: string };
type Result = { success: boolean; message?: string };

const TYPE: Record<InboxSourceKey, { label: string; tone: PillTone }> = {
  MESSAGE: { label: "Message", tone: "brand" },
  REGISTRATION: { label: "Registration", tone: "success" },
  APPLICATION: { label: "School application", tone: "royal" },
};

const when = (iso: string) => {
  const d = new Date(iso);
  const sameDay = new Date().toDateString() === d.toDateString();
  return sameDay
    ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year:
          d.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
      });
};

/** A number as WhatsApp wants it: digits with country code (Nigeria default). */
export function whatsappNumber(raw: string) {
  const digits = raw.replace(/[^\d+]/g, "");
  if (!digits) return "";
  if (digits.startsWith("+")) return digits.slice(1);
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11)
    return `234${digits.slice(1)}`;
  return digits;
}

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";

const whatsapp = (i: InboxItem) => {
  const n = whatsappNumber(i.phone);
  return n
    ? `https://wa.me/${n}?text=${encodeURIComponent(`Hi ${firstName(i.name)}, this is Dexta. `)}`
    : null;
};

function toCsv(items: InboxItem[], people: Person[]) {
  const cell = (v: string) => {
    const s = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = [
    "Type",
    "Name",
    "Email",
    "Phone",
    "Subject",
    "Received",
    "Status",
    "Read",
    "Done",
    "Assigned to",
    "Details",
  ];
  const rows = items.map((i) => [
    TYPE[i.source].label,
    i.name,
    i.email,
    i.phone,
    i.subject,
    new Date(i.receivedAt).toISOString().replace("T", " ").slice(0, 16),
    i.status,
    i.read ? "Yes" : "No",
    i.done ? "Yes" : "No",
    people.find((p) => p.id === i.assigneeId)?.name ?? "",
    i.details.map((d) => `${d.label}: ${d.value}`).join(" | "),
  ]);
  return (
    String.fromCharCode(0xfeff) +
    [head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n")
  );
}

function download(items: InboxItem[], people: Person[]) {
  const blob = new globalThis.Blob([toCsv(items, people)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inbox-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function InboxView({
  items: initial,
  people,
  meId,
  meName,
  access,
  initialAssigned,
  initialItem,
}: {
  items: InboxItem[];
  people: Person[];
  meId: string;
  meName: string;
  access: InboxAccess;
  initialAssigned?: "me";
  initialItem?: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [view, setView] = useState<"open" | "done" | "all">("open");
  const [openKey, setOpenKey] = useState<string | null>(initialItem ?? null);
  const [assigning, setAssigning] = useState<string[] | null>(null);
  const [, start] = useTransition();
  useEffect(() => setItems(initial), [initial]);
  // Opened from a link (e.g. the dashboard): counts as read, like a click.
  useEffect(() => {
    if (!initialItem) return;
    const i = initial.find((x) => x.key === initialItem);
    if (i && !i.read) void markOpened(i.key);
    // Only on arrival.
  }, []);

  const nameOf = (id: string) => people.find((p) => p.id === id)?.name ?? "";
  const shown = useMemo(
    () =>
      items.filter((i) =>
        view === "open" ? !i.done : view === "done" ? i.done : true,
      ),
    [items, view],
  );
  const open = items.find((i) => i.key === openKey) ?? null;
  const unreadCount = items.filter((i) => !i.read && !i.done).length;

  /** Applies a change on screen at once, then saves it. */
  const update = (
    keys: string[],
    patch: Partial<InboxItem>,
    fn: () => Promise<Result>,
    ok?: string,
  ) => {
    const before = items;
    setItems((list) =>
      list.map((i) => (keys.includes(i.key) ? { ...i, ...patch } : i)),
    );
    start(async () => {
      const res = await fn();
      if (!res.success) {
        setItems(before);
        return void toast.error(res.message ?? "That didn't save.");
      }
      if (res.message) toast.info(res.message);
      else if (ok) toast.success(ok);
      router.refresh();
    });
  };

  const openItem = (i: InboxItem, reply = false) => {
    setOpenKey(i.key);
    if (!i.read) update([i.key], { read: true }, () => markOpened(i.key));
    if (reply)
      setTimeout(
        () =>
          document
            .getElementById("inbox-reply")
            ?.scrollIntoView({ behavior: "smooth", block: "start" }),
        350,
      );
  };

  const columns: Column<InboxItem>[] = [
    {
      key: "from",
      header: "From",
      primary: true,
      sortValue: (i) => i.name.toLowerCase(),
      cell: (i) => (
        <span className="flex min-w-0 items-start gap-2.5">
          <span
            aria-hidden
            className={cn(
              "mt-1.5 size-2 shrink-0 rounded-full",
              i.read ? "bg-transparent" : "bg-brand",
            )}
          />
          <span className="flex min-w-0 flex-col">
            <span className={cn("truncate", !i.read && "font-bold")}>
              {i.name}
              {!i.read && <span className="sr-only"> (unread)</span>}
            </span>
            <span className="text-surface-muted truncate text-xs">
              {i.email}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: "subject",
      header: "About",
      sortValue: (i) => i.subject,
      cell: (i) => (
        <span className="flex min-w-0 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <StatusPill tone={TYPE[i.source].tone}>
              {TYPE[i.source].label}
            </StatusPill>
            {i.status && (
              <span className="text-surface-muted text-xs">{i.status}</span>
            )}
          </span>
          <span className={cn("line-clamp-1 text-sm", !i.read && "font-bold")}>
            {i.subject}
          </span>
        </span>
      ),
    },
    {
      key: "assignee",
      header: "Assigned",
      hideBelow: "lg",
      sortValue: (i) => nameOf(i.assigneeId),
      cell: (i) =>
        i.assigneeId ? (
          <span className="flex items-center gap-2 text-sm">
            <Avatar name={nameOf(i.assigneeId) || "?"} size="sm" />
            {i.assigneeId === meId ? "You" : nameOf(i.assigneeId)}
          </span>
        ) : (
          <span className="text-surface-muted text-sm">—</span>
        ),
    },
    {
      key: "received",
      header: "Received",
      sortValue: (i) => i.receivedAt,
      className: "whitespace-nowrap",
      cell: (i) => when(i.receivedAt),
    },
  ];

  const sources = (Object.keys(TYPE) as InboxSourceKey[]).filter(
    (s) => access[s],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          label="Show"
          hideLabel
          value={view}
          onChange={setView}
          options={[
            {
              value: "open",
              label: `Open${unreadCount ? ` · ${unreadCount} new` : ""}`,
            },
            { value: "done", label: "Done" },
            { value: "all", label: "All" },
          ]}
        />
        <Button
          size="sm"
          variant="subtle"
          disabled={shown.length === 0}
          onClick={() => download(shown, people)}
        >
          <Download aria-hidden className="size-4" /> Export {shown.length}
        </Button>
      </div>

      <DataTable
        label="Inbox"
        rows={shown}
        columns={columns}
        getRowId={(i) => i.key}
        rowLabel={(i) => `${i.name}, ${TYPE[i.source].label}`}
        searchText={(i) =>
          `${i.name} ${i.email} ${i.phone} ${i.subject} ${i.details.map((d) => d.value).join(" ")}`
        }
        searchPlaceholder="Search name, email or what they wrote"
        onRowClick={openItem}
        initialFilters={initialAssigned ? { assigned: "me" } : undefined}
        filters={[
          ...(sources.length > 1
            ? [
                {
                  key: "type",
                  label: "Type",
                  options: sources.map((s) => ({
                    value: s,
                    label: TYPE[s].label,
                  })),
                  match: (i: InboxItem, v: string) => i.source === v,
                },
              ]
            : []),
          {
            key: "read",
            label: "Read",
            options: [
              { value: "unread", label: "Unread" },
              { value: "read", label: "Read" },
            ],
            match: (i, v) => (v === "unread" ? !i.read : i.read),
          },
          {
            key: "assigned",
            label: "Assigned",
            options: [
              { value: "me", label: "To me" },
              { value: "none", label: "Not assigned" },
              ...people
                .filter((p) => p.id !== meId)
                .map((p) => ({ value: p.id, label: p.name })),
            ],
            match: (i, v) =>
              v === "me"
                ? i.assigneeId === meId
                : v === "none"
                  ? !i.assigneeId
                  : i.assigneeId === v,
          },
        ]}
        bulkActions={[
          {
            label: "Mark read",
            icon: <MailOpen />,
            onClick: (keys) =>
              update(
                keys,
                { read: true },
                () => setRead(keys, true),
                "Marked read",
              ),
          },
          {
            label: "Mark unread",
            icon: <Mail />,
            onClick: (keys) =>
              update(
                keys,
                { read: false },
                () => setRead(keys, false),
                "Marked unread",
              ),
          },
          {
            label: "Assign",
            icon: <UserPlus />,
            onClick: (keys) => setAssigning(keys),
          },
          view === "done"
            ? {
                label: "Reopen",
                icon: <RotateCcw />,
                onClick: (keys) =>
                  update(
                    keys,
                    { done: false },
                    () => setDone(keys, false),
                    "Reopened",
                  ),
              }
            : {
                label: "Mark done",
                icon: <CheckCheck />,
                onClick: (keys) =>
                  update(
                    keys,
                    { done: true, read: true },
                    () => setDone(keys, true),
                    "Marked done",
                  ),
              },
          {
            label: "Export",
            icon: <Download />,
            onClick: (keys) =>
              download(
                items.filter((i) => keys.includes(i.key)),
                people,
              ),
          },
        ]}
        rowActions={(i) => [
          { label: "Open", icon: <InboxIcon />, onSelect: () => openItem(i) },
          {
            label: "Reply by email",
            icon: <Mail />,
            onSelect: () => openItem(i, true),
          },
          {
            label: "Reply on WhatsApp",
            icon: <MessageCircle />,
            href: whatsapp(i) ?? undefined,
            external: true,
            hidden: !whatsapp(i),
          },
          "separator",
          {
            label: i.read ? "Mark unread" : "Mark read",
            icon: i.read ? <Mail /> : <MailOpen />,
            onSelect: () =>
              update([i.key], { read: !i.read }, () =>
                setRead([i.key], !i.read),
              ),
          },
          {
            label: "Assign…",
            icon: <UserPlus />,
            onSelect: () => setAssigning([i.key]),
          },
          {
            label: i.done ? "Reopen" : "Mark done",
            icon: i.done ? <RotateCcw /> : <CheckCheck />,
            onSelect: () =>
              update(
                [i.key],
                i.done ? { done: false } : { done: true, read: true },
                () => setDone([i.key], !i.done),
                i.done ? "Reopened" : "Marked done",
              ),
          },
          {
            label:
              i.source === "REGISTRATION"
                ? "Accept or decline"
                : "Open application",
            icon: <ExternalLink />,
            href: i.href ?? undefined,
            hidden: !i.href,
          },
        ]}
        empty={{
          icon: <InboxIcon />,
          title:
            items.length === 0
              ? "Nothing here yet"
              : view === "open"
                ? "All caught up"
                : "Nothing matches",
          description:
            items.length === 0
              ? "Messages, registrations and applications appear here as they arrive."
              : view === "open"
                ? "Everything is read and done. Nice."
                : "Try another search or filter.",
        }}
      />

      <SidePanel
        open={!!open}
        onOpenChange={(o) => !o && setOpenKey(null)}
        title={open?.name ?? ""}
        description={
          open
            ? `${TYPE[open.source].label} · ${new Date(open.receivedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}`
            : ""
        }
        width="lg"
        footer={
          open && (
            <>
              <Button
                size="sm"
                variant="subtle"
                onClick={() => {
                  update(
                    [open.key],
                    { read: false },
                    () => setRead([open.key], false),
                    "Marked unread",
                  );
                  setOpenKey(null);
                }}
              >
                Mark unread
              </Button>
              <Button
                size="sm"
                variant={open.done ? "subtle" : "primary"}
                onClick={() => {
                  update(
                    [open.key],
                    open.done ? { done: false } : { done: true, read: true },
                    () => setDone([open.key], !open.done),
                    open.done ? "Reopened" : "Marked done",
                  );
                  if (!open.done) setOpenKey(null);
                }}
              >
                {open.done ? "Reopen" : "Mark done"}
              </Button>
            </>
          )
        }
      >
        {open && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone={TYPE[open.source].tone}>
                {TYPE[open.source].label}
              </StatusPill>
              {open.status && <StatusPill>{open.status}</StatusPill>}
              {open.done && <StatusPill tone="success">Done</StatusPill>}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button
                size="sm"
                onClick={() =>
                  document
                    .getElementById("inbox-reply")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              >
                <Mail aria-hidden className="size-4" /> Reply by email
              </Button>
              {whatsapp(open) && (
                <Button
                  size="sm"
                  variant="subtle"
                  href={whatsapp(open)!}
                  external
                >
                  <MessageCircle aria-hidden className="size-4" /> WhatsApp
                </Button>
              )}
              {open.href && (
                <Button size="sm" variant="subtle" href={open.href}>
                  {open.source === "REGISTRATION"
                    ? "Accept or decline"
                    : "Open application"}
                  <ExternalLink aria-hidden className="size-4" />
                </Button>
              )}
            </div>

            <SelectField
              label="Assigned to"
              value={open.assigneeId}
              onChange={(e) => {
                const v = e.target.value;
                update(
                  [open.key],
                  { assigneeId: v },
                  () => assign([open.key], v || null),
                  v
                    ? `Assigned to ${v === meId ? "you" : nameOf(v)}`
                    : "Unassigned",
                );
              }}
              options={[
                { value: "", label: "No one" },
                ...people.map((p) => ({
                  value: p.id,
                  label: p.id === meId ? `${p.name} (you)` : p.name,
                })),
              ]}
            />

            <dl className="divide-surface-rule flex flex-col divide-y rounded-[10px] bg-white ring-1 ring-black/[0.06]">
              <Row label="Email">{open.email}</Row>
              {open.phone && <Row label="Phone">{open.phone}</Row>}
              {open.details.map((d, n) => (
                <Row key={`${d.label}-${n}`} label={d.label}>
                  {d.value}
                </Row>
              ))}
            </dl>

            <div id="inbox-reply" className="scroll-mt-4">
              <ReplyComposer
                key={open.key}
                item={open}
                meName={meName}
                onSent={(markDone) => {
                  setItems((list) =>
                    list.map((x) =>
                      x.key === open.key
                        ? { ...x, read: true, done: markDone || x.done }
                        : x,
                    ),
                  );
                  if (markDone) setOpenKey(null);
                  router.refresh();
                }}
              />
            </div>
          </div>
        )}
      </SidePanel>

      {assigning && (
        <AssignDialog
          count={assigning.length}
          people={people}
          meId={meId}
          onClose={() => setAssigning(null)}
          onAssign={(personId) => {
            const keys = assigning;
            setAssigning(null);
            update(
              keys,
              { assigneeId: personId },
              () => assign(keys, personId || null),
              personId
                ? `Assigned to ${personId === meId ? "you" : nameOf(personId)}`
                : "Unassigned",
            );
          }}
        />
      )}
    </div>
  );
}

function Row({
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

function AssignDialog({
  count,
  people,
  meId,
  onClose,
  onAssign,
}: {
  count: number;
  people: Person[];
  meId: string;
  onClose: () => void;
  onAssign: (personId: string) => void;
}) {
  const [person, setPerson] = useState(meId);
  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title={`Assign ${count === 1 ? "this item" : `${count} items`}`}
      description="They get an email with a link to their inbox (not when you assign yourself)."
      size="sm"
      footer={
        <>
          <Button size="sm" variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => onAssign(person)}>
            Assign
          </Button>
        </>
      }
    >
      <SelectField
        label="Assign to"
        value={person}
        onChange={(e) => setPerson(e.target.value)}
        options={[
          ...people.map((p) => ({
            value: p.id,
            label: p.id === meId ? `${p.name} (you)` : p.name,
          })),
          { value: "", label: "No one (unassign)" },
        ]}
      />
    </Modal>
  );
}
