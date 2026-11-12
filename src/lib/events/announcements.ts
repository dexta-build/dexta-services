/**
 * Announcements to event attendees: the tags people can use in the
 * message and how they're filled in. Safe on server and client (the
 * composer shows the same tags it sends).
 */

export type RegStatus = "ACCEPTED" | "PENDING" | "DECLINED";

export type AnnouncementInput = {
  /** One event, or "all" for everyone registered for any event. */
  eventId: string;
  statuses: RegStatus[];
  subject: string;
  body: string;
  /** Show the event's name, time and place, with a link, under the message. */
  includeEvent: boolean;
  /** Media library files to send with it. */
  fileIds: string[];
  fileMode: "attach" | "link";
};

export const TAGS = [
  { tag: "{first_name}", label: "First name" },
  { tag: "{name}", label: "Full name" },
  { tag: "{event}", label: "Event" },
  { tag: "{date}", label: "Date and time" },
  { tag: "{location}", label: "Location" },
  { tag: "{event_link}", label: "Event link" },
] as const;

export type TagValues = {
  name: string;
  event: string;
  date: string;
  location: string;
  eventLink: string;
};

export function fillTags(text: string, v: TagValues) {
  const first = v.name.trim().split(/\s+/)[0] ?? "";
  return text
    .replace(/\{first_name\}/g, first)
    .replace(/\{name\}/g, v.name)
    .replace(/\{event\}/g, v.event)
    .replace(/\{date\}/g, v.date)
    .replace(/\{location\}/g, v.location)
    .replace(/\{event_link\}/g, v.eventLink);
}

export function checkAnnouncement(input: AnnouncementInput) {
  if (!input.statuses.length) return "Choose who to send it to.";
  if (!input.subject.trim()) return "Add a subject.";
  if (input.subject.length > 200) return "The subject is too long.";
  const words = input.body
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
  if (!words) return "Write the message.";
  if (input.body.length > 100_000) return "The message is too long.";
  return null;
}
