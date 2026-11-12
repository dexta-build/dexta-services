import "server-only";
import { unstable_cache } from "next/cache";
import { resourcesByIds } from "./cloudinary";
import { collectSiteCloudinaryIds, findUsage, type MediaUsage } from "./usage";

/**
 * Broken media: Cloudinary files the site's content points to that no
 * longer exist. Checked on demand (the dashboard's first view or "Check
 * again"), never on a timer; the result is cached until checked again.
 */

export const MEDIA_HEALTH_TAG = "media-health";

export type MediaHealth = {
  checkedAt: string;
  /** Cloudinary files the site refers to. */
  total: number;
  missing: { id: string; usage: MediaUsage[] }[];
  /** Missing files beyond the ones listed with their usage. */
  more: number;
  error?: string;
};

const LIST_WITH_USAGE = 12;

async function checkMedia(): Promise<MediaHealth> {
  const checkedAt = new Date().toISOString();
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  if (!cloudName)
    return {
      checkedAt,
      total: 0,
      missing: [],
      more: 0,
      error: "Cloudinary isn't set up.",
    };
  try {
    // Only content the site shows; retired tables don't count as broken.
    const referenced = await collectSiteCloudinaryIds(cloudName, {
      includeLegacy: false,
    });
    const found = new Set<string>();
    for (const type of ["image", "video"] as const) {
      const pending = referenced.filter((id) => !found.has(id));
      for (let i = 0; i < pending.length; i += 100) {
        const batch = await resourcesByIds(pending.slice(i, i + 100), type);
        for (const r of batch) found.add(r.public_id);
      }
    }
    const missingIds = referenced.filter((id) => !found.has(id));
    const listed = missingIds.slice(0, LIST_WITH_USAGE);
    const missing = await Promise.all(
      listed.map(async (id) => ({ id, usage: await findUsage([id]) })),
    );
    return {
      checkedAt,
      total: referenced.length,
      missing,
      more: missingIds.length - listed.length,
    };
  } catch (error) {
    return {
      checkedAt,
      total: 0,
      missing: [],
      more: 0,
      error: `The check couldn't reach Cloudinary (${(error as Error).message ?? "unknown error"}).`,
    };
  }
}

export const getMediaHealth = unstable_cache(checkMedia, ["media-health-v2"], {
  revalidate: false,
  tags: [MEDIA_HEALTH_TAG],
});
