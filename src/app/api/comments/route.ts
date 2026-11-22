import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdmin } from "@/lib/env";
import { roleAtLeast } from "@/lib/storage/categories";
import { cleanBody, COMMENT_COLS, commentDTO, loadThread, TARGETS, targetExists, type TargetType } from "@/lib/comments";
import { logActivity } from "@/lib/audit";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store" };
const err = (message: string, status = 400) => NextResponse.json({ error: message }, { status, headers: noStore });

/** GET /api/comments?type=article&id=… — the whole thread for one post. */
export async function GET(req: NextRequest) {
  if (!hasSupabaseAdmin()) return NextResponse.json({ comments: [], total: 0, viewer: null }, { headers: noStore });
  const type = req.nextUrl.searchParams.get("type") as TargetType;
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!TARGETS.includes(type) || !id || id.length > 64) return err("invalid target");
  const viewer = await getSessionUser();
  return NextResponse.json(await loadThread(type, id, viewer), { headers: noStore });
}

const bodySchema = z.string().transform(cleanBody).pipe(z.string().min(1, "মন্তব্য লিখুন।").max(3000, "মন্তব্য ৩০০০ অক্ষরের মধ্যে রাখুন।"));
const action = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), type: z.enum(TARGETS), id: z.string().max(64), parentId: z.uuid().nullish(), body: bodySchema }),
  z.object({ action: z.literal("edit"), commentId: z.uuid(), body: bodySchema }),
  z.object({ action: z.literal("delete"), commentId: z.uuid() }),
  z.object({ action: z.literal("report"), commentId: z.uuid(), reason: z.string().max(300).optional() }),
  z.object({ action: z.literal("moderate"), commentId: z.uuid(), status: z.enum(["visible", "hidden"]) }),
]);

/** POST /api/comments — create, edit, delete, react, report, moderate. */
export async function POST(req: NextRequest) {
  if (!hasSupabaseAdmin()) return err("মন্তব্য সাময়িকভাবে বন্ধ আছে।", 503);
  const user = await getSessionUser();
  if (!user) return err("মন্তব্য করতে লগইন করুন।", 401);
  const parsed = action.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "অনুরোধটি সঠিক নয়।");
  const a = parsed.data;
  const db = createAdminClient();
  const isStaff = roleAtLeast(user.role, "editor");

  if (a.action === "create") {
    if (!(await targetExists(a.type, a.id))) return err("পোস্টটি পাওয়া যায়নি।", 404);
    // Rate limit: 5 comments per 2 minutes, and no exact repeats within 10 minutes.
    const since = new Date(Date.now() - 2 * 60_000).toISOString();
    const { count } = await db.from("comments").select("id", { count: "exact", head: true }).eq("author_id", user.id).gte("created_at", since);
    if ((count ?? 0) >= 5 && !isStaff) return err("খুব দ্রুত মন্তব্য করছেন। একটু পরে আবার চেষ্টা করুন।", 429);
    const { data: dup } = await db.from("comments").select("id").eq("author_id", user.id).eq("body", a.body).gte("created_at", new Date(Date.now() - 10 * 60_000).toISOString()).limit(1);
    if (dup?.length) return err("একই মন্তব্য আগেই করেছেন।", 409);
    // Replies are two levels deep (Facebook style): replying to a reply attaches to its root.
    let parentId: string | null = null;
    if (a.parentId) {
      const { data: parent } = await db.from("comments").select("id, parent_id, target_type, target_id, status").eq("id", a.parentId).maybeSingle();
      if (!parent || parent.target_type !== a.type || parent.target_id !== a.id || parent.status !== "visible") return err("যে মন্তব্যের উত্তর দিচ্ছেন সেটি পাওয়া যায়নি।", 404);
      parentId = parent.parent_id ?? parent.id;
    }
    const { data: row, error } = await db.from("comments").insert({ target_type: a.type, target_id: a.id, parent_id: parentId, author_id: user.id, body: a.body }).select(COMMENT_COLS).single();
    if (error || !row) return err("মন্তব্য প্রকাশ করা যায়নি। আবার চেষ্টা করুন।", 500);
    return NextResponse.json({ comment: await commentDTO(row, user.id) }, { headers: noStore });
  }

  const { data: c } = await db.from("comments").select("id, author_id, body").eq("id", a.commentId).maybeSingle();
  if (!c) return err("মন্তব্যটি পাওয়া যায়নি।", 404);
  const mine = c.author_id === user.id;

  switch (a.action) {
    case "edit":
      if (!mine) return err("শুধু নিজের মন্তব্য সম্পাদনা করা যায়।", 403);
      await db.from("comments").update({ body: a.body, edited_at: new Date().toISOString() }).eq("id", c.id);
      break;
    case "delete":
      if (!mine && !isStaff) return err("এই মন্তব্য মুছে ফেলার অনুমতি নেই।", 403);
      await db.from("comments").delete().eq("id", c.id);
      if (!mine) await logActivity(user, { action: "comment.delete", entity: "comment", entityId: c.id, summary: `মন্তব্য মুছে ফেলা হয়েছে: ${c.body.slice(0, 60)}` });
      break;
    case "report":
      if (mine) return err("নিজের মন্তব্য রিপোর্ট করা যায় না।");
      await db.from("comment_reports").upsert({ comment_id: c.id, user_id: user.id, reason: a.reason ?? null });
      return NextResponse.json({ ok: true, message: "রিপোর্ট পাঠানো হয়েছে। মডারেটরগণ দেখবেন।" }, { headers: noStore });
    case "moderate":
      if (!isStaff) return err("অনুমতি নেই।", 403);
      await db.from("comments").update({ status: a.status }).eq("id", c.id);
      await logActivity(user, { action: `comment.${a.status === "hidden" ? "hide" : "show"}`, entity: "comment", entityId: c.id, summary: `${a.status === "hidden" ? "লুকানো" : "আবার দেখানো"}: ${c.body.slice(0, 60)}` });
      revalidatePath("/admin/comments");
      break;
  }
  return NextResponse.json({ ok: true }, { headers: noStore });
}
