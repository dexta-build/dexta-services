import { requirePageAccess } from "@/lib/admin/session";
import { EventEditor } from "../event-editor";

export const metadata = { title: "New event" };

export default async function NewEventPage() {
  await requirePageAccess("events");
  return <EventEditor id={null} initial={null} />;
}
