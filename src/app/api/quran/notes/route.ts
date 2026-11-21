import { NextResponse, type NextRequest } from "next/server";
import { getFootnotes } from "@/lib/quran";

/** Footnotes for one ayah (loaded when the reader opens them). Cached at the CDN. */
export async function GET(req: NextRequest) {
  const s = Number(req.nextUrl.searchParams.get("s"));
  const a = Number(req.nextUrl.searchParams.get("a"));
  if (!Number.isInteger(s) || !Number.isInteger(a) || s < 1 || s > 114 || a < 1 || a > 286) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const notes = await getFootnotes(s, a);
  return NextResponse.json({ notes }, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
}
