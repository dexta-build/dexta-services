import { NextResponse, type NextRequest } from "next/server";
import { AdminAuthError, requireAdmin } from "@/lib/admin/session";
import { readRegistrations } from "@/lib/events/admin";
import { answerText } from "@/lib/events/fields";

/**
 * Registrations as a CSV file: ?event=<id> for one event (its questions
 * become columns), ?status=PENDING|ACCEPTED|DECLINED, ?ids=a,b for a
 * selection.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin("events");
  } catch (error) {
    const status =
      error instanceof AdminAuthError && error.status === 403 ? 403 : 401;
    return NextResponse.json({ error: "Not allowed" }, { status });
  }

  const params = request.nextUrl.searchParams;
  const eventId = params.get("event") || undefined;
  const status = params.get("status");
  const ids = params.get("ids")?.split(",").filter(Boolean);

  const { registrations, fields, events } = await readRegistrations(eventId);
  const rows = registrations.filter(
    (r) => (!status || r.status === status) && (!ids || ids.includes(r.id)),
  );

  // One column per question; same-labelled questions share a column.
  const labels: string[] = [];
  const keyFor = new Map<string, string>(); // `${eventId}:${name}` → label
  for (const e of events)
    for (const f of fields[e.id] ?? []) {
      if (!labels.includes(f.label)) labels.push(f.label);
      keyFor.set(`${e.id}:${f.name}`, f.label);
    }

  const head = [
    "Name",
    "Email",
    ...(eventId ? [] : ["Event"]),
    "Status",
    "Decline reason",
    "Registered",
    ...labels,
  ];
  const lines = rows.map((r) => {
    const byLabel = new Map<string, string>();
    for (const [name, value] of Object.entries(r.answers)) {
      const label = keyFor.get(`${r.eventId}:${name}`) ?? name;
      byLabel.set(label, answerText(value));
    }
    return [
      r.name,
      r.email,
      ...(eventId ? [] : [r.eventTitle]),
      r.status.charAt(0) + r.status.slice(1).toLowerCase(),
      r.declineReason,
      new Date(r.createdAt).toISOString().replace("T", " ").slice(0, 16),
      ...labels.map((l) => byLabel.get(l) ?? ""),
    ];
  });

  const csv =
    String.fromCharCode(0xfeff) + // so Excel reads UTF-8
    [head, ...lines]
      .map((cells) => cells.map(escapeCsv).join(","))
      .join("\r\n");
  const name = eventId
    ? (events[0]?.name ?? "event")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    : "all-events";
  return new globalThis.Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="registrations-${name}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

/** Quotes a cell; leading = + - @ are neutralised so spreadsheets don't run them. */
function escapeCsv(value: string): string {
  const v = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}
