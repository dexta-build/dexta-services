"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CalendarDays,
  Copy,
  ExternalLink,
  FileEdit,
  ImageOff,
  Lock,
  Pencil,
  Plus,
  Trash2,
  Unlock,
  Users,
} from "lucide-react";
import type { AdminEventRow, EventStatusValue } from "@/lib/events/admin";
import { stock } from "@/lib/site/stock-media";
import { Button } from "@/components/site/button";
import { StatusPill, type PillTone } from "@/components/admin/kit/layout";
import { DataTable, type Column } from "@/components/admin/kit/data-table";
import { useConfirm } from "@/components/admin/kit/feedback";
import { deleteEvents, duplicateEvent, setEventsStatus } from "./actions";

type Result = { success: boolean; message?: string };

export function eventState(
  e: Pick<AdminEventRow, "status" | "dateTime">,
  now: number,
): { label: string; tone: PillTone } {
  if (e.status === "DRAFT") return { label: "Draft", tone: "neutral" };
  if (now && Date.parse(e.dateTime) <= now)
    return { label: "Ended", tone: "neutral" };
  return e.status === "CLOSED"
    ? { label: "Registration closed", tone: "warning" }
    : { label: "Open", tone: "success" };
}

export const eventWhen = (iso: string, timeZone: string) =>
  new Date(iso).toLocaleString("en-GB", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function EventsManager({ events }: { events: AdminEventRow[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [, start] = useTransition();
  const [now, setNow] = useState(0);
  useEffect(() => setNow(Date.now()), []);

  const run = (fn: () => Promise<Result>, ok: string) =>
    start(async () => {
      const res = await fn();
      if (!res.success)
        return void toast.error(res.message ?? "That didn't work.");
      toast.success(ok);
      router.refresh();
    });
  const status = (ids: string[], s: EventStatusValue, ok: string) =>
    run(() => setEventsStatus(ids, s), ok);

  const columns: Column<AdminEventRow>[] = [
    {
      key: "title",
      header: "Event",
      primary: true,
      sortValue: (e) => e.title.toLowerCase(),
      cell: (e) => (
        <span className="flex min-w-0 items-center gap-3">
          {e.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- previews from any host
            <img
              src={stock(e.image, 128, 80)}
              alt=""
              className="bg-canvas h-10 w-16 shrink-0 rounded-[6px] object-cover"
            />
          ) : (
            <span className="bg-canvas text-surface-muted inline-flex h-10 w-16 shrink-0 items-center justify-center rounded-[6px]">
              <ImageOff aria-hidden className="size-4" />
            </span>
          )}
          <span className="flex min-w-0 flex-col">
            <Link
              href={`/admin/events/${e.id}`}
              onClick={(ev) => ev.stopPropagation()}
              className="truncate font-bold hover:underline"
            >
              {e.title}
            </Link>
            <span className="text-surface-muted truncate text-xs">
              {e.location}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: "date",
      header: "Date",
      sortValue: (e) => e.dateTime,
      cell: (e) => eventWhen(e.dateTime, e.timezone),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (e) => eventState(e, now).label,
      cell: (e) => {
        const s = eventState(e, now);
        return (
          <StatusPill tone={s.tone} dot>
            {s.label}
          </StatusPill>
        );
      },
    },
    {
      key: "regs",
      header: "Registrations",
      sortValue: (e) => e.pending + e.accepted + e.declined,
      cell: (e) => (
        <span className="flex flex-wrap items-center gap-1.5 text-xs">
          {e.pending > 0 && (
            <StatusPill tone="warning">{e.pending} pending</StatusPill>
          )}
          <span>
            <b>{e.accepted}</b>
            {e.attendeeLimit ? ` / ${e.attendeeLimit}` : ""} accepted
          </span>
        </span>
      ),
    },
  ];

  return (
    <DataTable
      label="Events"
      rows={events}
      columns={columns}
      getRowId={(e) => e.id}
      rowLabel={(e) => e.title}
      searchText={(e) => `${e.title} ${e.location}`}
      searchPlaceholder="Search events"
      onRowClick={(e) => router.push(`/admin/events/${e.id}`)}
      filters={[
        {
          key: "status",
          label: "Status",
          options: [
            { value: "Open", label: "Open" },
            { value: "Registration closed", label: "Registration closed" },
            { value: "Draft", label: "Drafts" },
            { value: "Ended", label: "Ended" },
            { value: "pending", label: "Waiting for replies" },
          ],
          match: (e, v) =>
            v === "pending" ? e.pending > 0 : eventState(e, now).label === v,
        },
      ]}
      bulkActions={[
        {
          label: "Open registration",
          icon: <Unlock />,
          onClick: (ids) => status(ids, "PUBLISHED", "Open for registration"),
        },
        {
          label: "Close registration",
          icon: <Lock />,
          onClick: (ids) => status(ids, "CLOSED", "Registration closed"),
        },
        {
          label: "Move to drafts",
          icon: <FileEdit />,
          onClick: (ids) => status(ids, "DRAFT", "Moved to drafts"),
        },
        {
          label: "Delete",
          icon: <Trash2 />,
          danger: true,
          onClick: async (ids) => {
            const ok = await confirm({
              title: `Delete ${ids.length} event${ids.length === 1 ? "" : "s"}?`,
              description:
                "Their registrations are deleted too. To keep them, move the events to drafts instead.",
              confirmLabel: "Delete",
              danger: true,
            });
            if (ok) run(() => deleteEvents(ids), "Deleted");
          },
        },
      ]}
      rowActions={(e) => [
        { label: "Edit", icon: <Pencil />, href: `/admin/events/${e.id}` },
        {
          label: "Registrations",
          icon: <Users />,
          href: `/admin/events/${e.id}?tab=registrations`,
        },
        {
          label: "View on site",
          icon: <ExternalLink />,
          href: `/events/${e.slug}`,
          external: true,
          hidden: e.status === "DRAFT",
        },
        {
          label: "Duplicate",
          icon: <Copy />,
          onSelect: () => run(() => duplicateEvent(e.id), "Copied as a draft"),
        },
        "separator",
        e.status === "PUBLISHED"
          ? {
              label: "Close registration",
              icon: <Lock />,
              onSelect: () => status([e.id], "CLOSED", "Registration closed"),
            }
          : {
              label: e.status === "DRAFT" ? "Publish" : "Reopen registration",
              icon: <Unlock />,
              onSelect: () =>
                status([e.id], "PUBLISHED", "Open for registration"),
            },
        "separator",
        {
          label: "Delete",
          icon: <Trash2 />,
          danger: true,
          onSelect: async () => {
            const ok = await confirm({
              title: `Delete ${e.title}?`,
              description: `Its ${e.pending + e.accepted + e.declined} registrations are deleted too.`,
              confirmLabel: "Delete",
              danger: true,
            });
            if (ok) run(() => deleteEvents([e.id]), "Deleted");
          },
        },
      ]}
      toolbar={
        <Button size="sm" href="/admin/events/new">
          <Plus aria-hidden className="size-4" /> New event
        </Button>
      }
      empty={{
        icon: <CalendarDays />,
        title: events.length ? "No events match" : "No events yet",
        description: events.length
          ? "Try another search or filter."
          : "Create your first event and its registration form.",
      }}
    />
  );
}
