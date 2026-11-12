import { NextResponse, type NextRequest } from "next/server";
import { findProfileRedirect, getTeamMember } from "@/lib/site/team-data";

/**
 * Profiles moved from /team/daniel-azu to /daniel-azu. Old links go
 * straight (one permanent redirect) to the person's current address, even
 * if it has changed since.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const slug = (await params).slug.toLowerCase();
  const current = (await getTeamMember(slug))
    ? slug
    : await findProfileRedirect(slug);
  const target = new URL(current ? `/${current}` : "/about#team", request.url);
  target.search = request.nextUrl.search;
  return NextResponse.redirect(target, 308);
}
