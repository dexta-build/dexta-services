import { requirePageAccess } from "@/lib/admin/session";
import { listFolders, libraryCounts, queryMedia } from "@/lib/media/queries";
import { PageHeader } from "@/components/admin/kit/layout";
import { Callout } from "@/components/admin/kit/display";
import {
  MediaBrowser,
  type LibraryData,
} from "@/components/admin/media/media-browser";

export const metadata = { title: "Media library" };

export default async function MediaLibraryPage() {
  const me = await requirePageAccess("media");

  let initial: LibraryData | undefined;
  let unavailable: string | null = null;
  try {
    const [page, folders, counts] = await Promise.all([
      queryMedia({}),
      listFolders(),
      libraryCounts(),
    ]);
    initial = { ...page, folders, counts };
  } catch (error) {
    const message = (error as Error).message ?? "";
    console.error("[media] library failed to load:", message);
    unavailable = /does not exist|relation .* not found|P2021/i.test(message)
      ? "missing-tables"
      : "error";
  }

  return (
    <>
      <PageHeader
        eyebrow="Media"
        title="Media *library*"
        description="Every image, video and document used on the site. Images are stored on Cloudinary; videos, CVs and other large files on R2."
      />
      {unavailable ? (
        <Callout tone="warning" title="The media library isn't set up yet">
          Run the database update for this release (prisma db push), then
          refresh.
        </Callout>
      ) : (
        <MediaBrowser
          mode="manage"
          initial={initial}
          canManage
          canImport={me.role === "ADMIN"}
        />
      )}
    </>
  );
}
