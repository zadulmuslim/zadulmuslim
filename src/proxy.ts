import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Refreshes the Supabase session cookie only where a session matters.
 * Public pages (home, articles, Q&A…) skip this entirely, so they are served
 * straight from Vercel's CDN without a round-trip to Supabase.
 * The browser client also refreshes tokens on its own.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/account/:path*",
    "/login",
    "/signup",
    "/reset-password",
    "/auth/:path*",
    "/api/media/:path*",
  ],
};
