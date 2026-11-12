/**
 * Files sent with emails from the admin. Shared by the composer (to show
 * the limits) and the server (to enforce them). Safe on server and client.
 */

/** File types email services accept and people can open. */
export const ATTACHABLE = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "csv",
  "txt",
  "rtf",
  "odt",
  "ods",
  "jpg",
  "jpeg",
  "png",
  "gif",
  "zip",
  "ics",
];

/** Above this total, files go as download links instead. */
export const MAX_ATTACH_BYTES = 5 * 1024 * 1024;

/** Announcements to more people than this send links, not attachments. */
export const ATTACH_GROUP_LIMIT = 25;

export type FileMode = "attach" | "link";

export type EmailFile = {
  /** Media library asset ID. */
  id: string;
  name: string;
  url: string;
  bytes: number | null;
};

export const extOf = (name: string) =>
  name.split(".").pop()?.toLowerCase() ?? "";

export const canAttach = (name: string) => ATTACHABLE.includes(extOf(name));

export function formatBytes(n: number | null | undefined) {
  if (!n) return "";
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * How files go out: attached when you asked and they're small enough and
 * the group is small; otherwise as download links (with the reason).
 */
export function fileMode(
  wanted: FileMode,
  files: Pick<EmailFile, "name" | "bytes">[],
  recipients: number,
): { mode: FileMode; reason: string | null } {
  if (!files.length) return { mode: wanted, reason: null };
  if (wanted === "link") return { mode: "link", reason: null };
  const total = files.reduce((n, f) => n + (f.bytes ?? 0), 0);
  if (files.some((f) => !canAttach(f.name)))
    return {
      mode: "link",
      reason:
        "Some files can't be attached (type not accepted by email apps), so they go as download links.",
    };
  if (total > MAX_ATTACH_BYTES)
    return {
      mode: "link",
      reason: `Together the files are ${formatBytes(total)} (over ${formatBytes(MAX_ATTACH_BYTES)}), so they go as download links.`,
    };
  if (recipients > ATTACH_GROUP_LIMIT)
    return {
      mode: "link",
      reason: `It's going to more than ${ATTACH_GROUP_LIMIT} people, so files go as download links (keeps it out of spam folders).`,
    };
  return { mode: "attach", reason: null };
}
