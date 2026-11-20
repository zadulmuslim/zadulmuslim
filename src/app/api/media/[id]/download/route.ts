import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getAccessUrl } from "@/lib/storage";
import { errorResponse, uuidParam } from "@/lib/api/http";

/**
 * GET /api/media/:id/download[?inline=1]
 * Checks access, then redirects to a short-lived signed R2 URL.
 * Public files without ?download redirect to the permanent CDN URL.
 */
export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const id = uuidParam.parse((await ctx.params).id);
    const inline = new URL(request.url).searchParams.get("inline") === "1";
    const url = await getAccessUrl(await getSessionUser(), id, { download: !inline });
    return NextResponse.redirect(url, { status: 302, headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    return errorResponse(err);
  }
}
