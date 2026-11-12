import "server-only";
import { Buffer } from "node:buffer";
import { createHash, timingSafeEqual } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/** Library uploads go here; posters for R2 videos go to their own folder. */
export const LIBRARY_FOLDER = "dexta/media";
export const POSTER_FOLDER = "dexta/media/posters";

/** Everything the browser needs for one signed, direct image upload. */
export function signImageUpload(folder = LIBRARY_FOLDER) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const secret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !secret) {
    throw new Error("Cloudinary isn't set up (missing CLOUDINARY_* settings).");
  }
  const timestamp = Math.round(Date.now() / 1000);
  const params = { folder, timestamp };
  const signature = cloudinary.utils.api_sign_request(params, secret);
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    fields: {
      api_key: apiKey,
      folder,
      timestamp: String(timestamp),
      signature,
    },
  };
}

/** Checks that an upload response really came from Cloudinary. */
export function verifyUploadResponse(
  publicId: string,
  version: number | string,
  signature: string,
) {
  const secret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!secret) return false;
  // Same as the SDK's (untyped) verify_api_response_signature: SHA-1 of the
  // sorted params plus the secret.
  const expected = createHash("sha1")
    .update(`public_id=${publicId}&version=${version}${secret}`)
    .digest("hex");
  return (
    expected.length === signature.length &&
    timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  );
}

export async function destroyCloudinary(
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image",
) {
  try {
    const res = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });
    return res.result === "ok" || res.result === "not found";
  } catch (error) {
    console.error(
      "[media] Cloudinary delete failed:",
      (error as Error).message,
    );
    return false;
  }
}

export type CloudinaryListed = {
  public_id: string;
  resource_type: "image" | "video" | "raw";
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
  duration?: number;
  secure_url: string;
  created_at: string;
};

/**
 * Looks up specific files by public ID (up to 100 per call). Only files we
 * ask for are returned, so other projects on the account are never listed.
 */
export async function resourcesByIds(
  publicIds: string[],
  resourceType: "image" | "video",
) {
  if (publicIds.length === 0) return [];
  const res = (await cloudinary.api.resources_by_ids(publicIds, {
    resource_type: resourceType,
    max_results: 100,
  })) as unknown as { resources: CloudinaryListed[] };
  return res.resources ?? [];
}
