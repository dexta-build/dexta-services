import { draftMode } from "next/headers";
import { NextResponse } from "next/server";

/** Turns preview off and goes back to the page. */
export async function GET(request: globalThis.Request) {
  (await draftMode()).disable();
  const path = new URL(request.url).searchParams.get("path") ?? "/";
  const safe = path.startsWith("/") && !path.startsWith("//") ? path : "/";
  return NextResponse.redirect(new URL(safe, request.url));
}
