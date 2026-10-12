import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js 16+ Proxy
 *
 * Sits at the network boundary directly in front of the application.
 * Fast edge short-circuiting for /admin routes before running React server components or DB queries.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /admin routes except /admin/login
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const sessionToken =
      request.cookies.get("authjs.session-token")?.value ??
      request.cookies.get("__Secure-authjs.session-token")?.value ??
      request.cookies.get("next-auth.session-token")?.value ??
      request.cookies.get("__Secure-next-auth.session-token")?.value;

    if (!sessionToken) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all /admin paths, excluding API routes and static assets
     */
    "/admin/:path*",
  ],
};
