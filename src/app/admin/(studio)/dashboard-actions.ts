"use server";

import { updateTag } from "next/cache";
import { AdminAuthError, requireAdmin } from "@/lib/admin/session";
import { MEDIA_HEALTH_TAG } from "@/lib/media/health";

/** Runs the broken media check again (it's otherwise kept until asked). */
export async function recheckMedia(): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    await requireAdmin("media");
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof AdminAuthError && error.status === 403
          ? "You don't have access to the media library."
          : "Your session has ended. Sign in again.",
    };
  }
  updateTag(MEDIA_HEALTH_TAG);
  return { success: true };
}
