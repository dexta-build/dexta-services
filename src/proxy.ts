import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  areaForPath,
  canAccess,
  isPublicAdminPath,
  type AdminRole,
} from "@/lib/admin/permissions";

/**
 * Next.js 16 proxy for /admin:
 * - login, forgot/reset password and invite pages are public
 *   (signed-in users visiting login go straight to the dashboard);
 * - every other admin page needs a session;
 * - pages in an area the user can't access redirect to the dashboard.
 * Server actions re-check everything with requireAdmin().
 */
export const proxy = auth((request) => {
  const { pathname, search } = request.nextUrl;
  const session = request.auth;

  if (isPublicAdminPath(pathname)) {
    if (session && pathname.startsWith("/admin/login")) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (!session?.user) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  const area = areaForPath(pathname);
  const user = {
    role: (session.user.role ?? "ADMIN") as AdminRole,
    access: session.user.access ?? [],
  };
  if (area && !canAccess(user, area)) {
    return NextResponse.redirect(new URL(`/admin?denied=${area}`, request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
