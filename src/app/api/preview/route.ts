import { draftMode } from "next/headers";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/session";

/** Turns on preview (drafts) for this browser, then opens the page. */
export async function GET(request: globalThis.Request) {
  try {
    await requireAdmin(null);
  } catch {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  const path = new URL(request.url).searchParams.get("path") ?? "/";
  const safe = path.startsWith("/") && !path.startsWith("//") ? path : "/";
  (await draftMode()).enable();
  return NextResponse.redirect(new URL(safe, request.url));
}
