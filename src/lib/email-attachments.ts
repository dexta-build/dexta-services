import "server-only";
import prisma from "@/lib/prisma";
import type { EmailFile } from "./email-files";

/**
 * Files for an email, looked up in the media library by ID. Only the
 * site's own files can be sent, so nobody can make it fetch an outside
 * address; the name, address and size come from the library, not the
 * browser.
 */
export async function loadEmailFiles(ids: string[]): Promise<EmailFile[]> {
  const unique = [...new Set(ids)].slice(0, 10);
  if (!unique.length) return [];
  const rows = await prisma.mediaAsset.findMany({
    where: { id: { in: unique } },
    select: { id: true, fileName: true, title: true, url: true, bytes: true },
  });
  return unique
    .map((id) => rows.find((r) => r.id === id))
    .filter((r): r is NonNullable<typeof r> => !!r)
    .map((r) => ({
      id: r.id,
      // Keep the real extension so email apps know what it is.
      name: r.fileName,
      url: r.url,
      bytes: r.bytes,
    }));
}
