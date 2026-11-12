import { notFound } from "next/navigation";
import { requirePageAccess } from "@/lib/admin/session";
import { readEventForEditor, readRegistrations } from "@/lib/events/admin";
import { EventEditor } from "../event-editor";

export const metadata = { title: "Edit event" };

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageAccess("events");
  const { id } = await params;
  const [event, regs] = await Promise.all([
    readEventForEditor(id).catch(() => null),
    readRegistrations(id).catch(() => null),
  ]);
  if (!event) notFound();
  return (
    <EventEditor
      key={event.id}
      id={event.id}
      initial={event.form}
      oldSlugs={event.oldSlugs}
      counts={event.counts}
      registrations={regs?.registrations ?? []}
      fieldsMap={regs?.fields ?? {}}
      eventOptions={regs?.events ?? []}
    />
  );
}
