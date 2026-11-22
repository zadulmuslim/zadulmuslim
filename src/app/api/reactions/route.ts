import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdmin } from "@/lib/env";
import { postReactions, REACTIONS, TARGETS, targetExists, type TargetType } from "@/lib/comments";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store" };

/** GET /api/reactions?type=article&id=… — counts and the viewer's reaction. */
export async function GET(req: NextRequest) {
  if (!hasSupabaseAdmin()) return NextResponse.json({ counts: {}, mine: null, signedIn: false }, { headers: noStore });
  const type = req.nextUrl.searchParams.get("type") as TargetType;
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!TARGETS.includes(type) || !id || id.length > 64) return NextResponse.json({ error: "invalid target" }, { status: 400 });
  const user = await getSessionUser();
  return NextResponse.json(await postReactions(type, id, user?.id ?? null), { headers: noStore });
}

const schema = z.object({ type: z.enum(TARGETS), id: z.string().min(1).max(64), kind: z.enum(REACTIONS).nullable() });

/** POST — set (or with kind=null, remove) the viewer's reaction on a post. */
export async function POST(req: NextRequest) {
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: "সাময়িকভাবে বন্ধ আছে।" }, { status: 503 });
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "প্রতিক্রিয়া জানাতে লগইন করুন।" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "অনুরোধটি সঠিক নয়।" }, { status: 400 });
  const { type, id, kind } = parsed.data;
  const db = createAdminClient();
  if (kind) {
    if (!(await targetExists(type, id))) return NextResponse.json({ error: "পোস্টটি পাওয়া যায়নি।" }, { status: 404 });
    const { error } = await db.from("post_reactions").upsert({ target_type: type, target_id: id, user_id: user.id, kind, created_at: new Date().toISOString() });
    if (error) return NextResponse.json({ error: "সম্ভব হয়নি, আবার চেষ্টা করুন।" }, { status: 500 });
  } else {
    await db.from("post_reactions").delete().eq("target_type", type).eq("target_id", id).eq("user_id", user.id);
  }
  return NextResponse.json({ ok: true }, { headers: noStore });
}
