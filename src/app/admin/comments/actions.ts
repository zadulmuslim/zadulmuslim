"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionUser } from "@/lib/auth/action-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/audit";

const id = z.uuid();

export async function moderateComment(commentId: string, op: "hide" | "show" | "delete" | "dismiss"): Promise<{ error?: string }> {
  const { user, error } = await actionUser("editor");
  if (!user) return { error };
  if (!id.safeParse(commentId).success) return { error: "মন্তব্যটি পাওয়া যায়নি।" };
  const db = createAdminClient();
  const { data: c } = await db.from("comments").select("id, body").eq("id", commentId).maybeSingle();
  if (!c) return { error: "মন্তব্যটি পাওয়া যায়নি।" };
  const short = c.body.slice(0, 60);
  if (op === "delete") {
    await db.from("comments").delete().eq("id", c.id);
    await logActivity(user, { action: "comment.delete", entity: "comment", entityId: c.id, summary: `মন্তব্য মুছে ফেলা হয়েছে: ${short}` });
  } else if (op === "dismiss") {
    await db.from("comment_reports").delete().eq("comment_id", c.id);
  } else {
    await db.from("comments").update({ status: op === "hide" ? "hidden" : "visible" }).eq("id", c.id);
    if (op === "show") await db.from("comment_reports").delete().eq("comment_id", c.id);
    await logActivity(user, { action: `comment.${op}`, entity: "comment", entityId: c.id, summary: `${op === "hide" ? "মন্তব্য লুকানো হয়েছে" : "মন্তব্য আবার দেখানো হয়েছে"}: ${short}` });
  }
  revalidatePath("/admin/comments");
  return {};
}
