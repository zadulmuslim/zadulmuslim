import { NextResponse, type NextRequest } from "next/server";
import { search, SEARCH_TYPES, type SearchType } from "@/lib/search";

/** GET /api/search?q=…&type=quran,hadith&limit=4&offset=0 — JSON for the live search UI. */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const q = (p.get("q") ?? "").slice(0, 100);
  const types = (p.get("type") ?? "").split(",").filter((t): t is SearchType => (SEARCH_TYPES as readonly string[]).includes(t));
  const limit = Math.min(20, Math.max(1, Number(p.get("limit")) || 4));
  const offset = Math.min(1000, Math.max(0, Number(p.get("offset")) || 0));
  const result = await search(q, { types, limit, offset });
  return NextResponse.json(result, { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" } });
}
