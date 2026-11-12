import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireAdminSession } from "@/lib/admin-auth";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: globalThis.Request) {
  try {
    await requireAdminSession(null, "deleteMedia");

    const { publicId, resourceType } = await request.json();

    if (!publicId || typeof publicId !== "string") {
      return NextResponse.json(
        { error: "publicId is required" },
        { status: 400 },
      );
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type:
        resourceType === "raw"
          ? "raw"
          : resourceType === "video"
            ? "video"
            : "image",
    });

    return NextResponse.json({ result: result.result });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("[Cloudinary Delete]", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 },
    );
  }
}
