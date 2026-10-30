import { NextResponse, type NextRequest } from "next/server";
import { DEPARTMENT_SLUGS } from "@/lib/config";

// /shop/<unknown> would otherwise answer 200: the department page streams its
// loading shell before notFound() can run. Rewriting to a path that doesn't
// exist renders the 404 page with a real 404 status.
export function middleware(req: NextRequest) {
  const slug = req.nextUrl.pathname.split("/")[2];
  if (!(DEPARTMENT_SLUGS as readonly string[]).includes(decodeURIComponent(slug ?? ""))) {
    return NextResponse.rewrite(new URL("/__not-found", req.url));
  }
}

export const config = { matcher: "/shop/:slug" };
