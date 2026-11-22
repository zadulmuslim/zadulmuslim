import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdmin } from "@/lib/env";
import { toBnDigits } from "@/lib/utils";

export interface MyComment {
  id: string;
  body: string;
  createdAt: string;
  hidden: boolean;
  isReply: boolean;
  replyCount: number;
  editedAt: string | null;
  post: { href: string; title: string; type: string } | null;
}

const TYPE_LABEL: Record<string, string> = { question: "প্রশ্নোত্তর", article: "প্রবন্ধ", hadith: "হাদীস", lecture: "বয়ান" };

/** The member's own comments (with links to the posts) and activity counts. */
export async function getMyActivity(userId: string): Promise<{ comments: MyComment[]; commentCount: number; reactionCount: number }> {
  if (!hasSupabaseAdmin()) return { comments: [], commentCount: 0, reactionCount: 0 };
  const db = createAdminClient();
  const [{ data, count }, { count: reactionCount }] = await Promise.all([
    db.from("comments").select("id, target_type, target_id, parent_id, body, status, edited_at, created_at", { count: "exact" }).eq("author_id", userId).order("created_at", { ascending: false }).limit(30),
    db.from("post_reactions").select("user_id", { count: "exact", head: true }).eq("user_id", userId),
  ]);
  const rows = data ?? [];
  // Replies others (or you) wrote under each of your top-level comments.
  const rootIds = rows.filter((r) => !r.parent_id).map((r) => r.id);
  const { data: replyRows } = rootIds.length ? await db.from("comments").select("parent_id").in("parent_id", rootIds).eq("status", "visible") : { data: [] };
  const replies = new Map<string, number>();
  for (const r of replyRows ?? []) if (r.parent_id) replies.set(r.parent_id, (replies.get(r.parent_id) ?? 0) + 1);
  const ids = (t: string) => [...new Set(rows.filter((r) => r.target_type === t).map((r) => r.target_id))];
  const empty = Promise.resolve({ data: [] as { id: string; slug: string; title: string }[] });
  const [qs, as, ls] = await Promise.all([
    ids("question").length ? db.from("questions").select("id, slug, title").in("id", ids("question")) : empty,
    ids("article").length ? db.from("articles").select("id, slug, title").in("id", ids("article")) : empty,
    ids("lecture").length ? db.from("lectures").select("id, slug, title").in("id", ids("lecture")) : empty,
  ]);
  const posts = new Map<string, { href: string; title: string; type: string }>();
  for (const x of qs.data ?? []) posts.set(`question:${x.id}`, { href: `/qa/${x.slug}`, title: x.title, type: TYPE_LABEL.question! });
  for (const x of as.data ?? []) posts.set(`article:${x.id}`, { href: `/articles/${x.slug}`, title: x.title, type: TYPE_LABEL.article! });
  for (const x of ls.data ?? []) posts.set(`lecture:${x.id}`, { href: `/lectures/${x.slug}`, title: x.title, type: TYPE_LABEL.lecture! });
  return {
    comments: rows.map((r) => ({
      id: r.id,
      body: r.body,
      createdAt: r.created_at,
      hidden: r.status === "hidden",
      isReply: Boolean(r.parent_id),
      replyCount: replies.get(r.id) ?? 0,
      editedAt: r.edited_at,
      post: r.target_type === "hadith" ? { href: `/hadith/${r.target_id}`, title: `হাদীস নং ${toBnDigits(r.target_id)}`, type: TYPE_LABEL.hadith! } : posts.get(`${r.target_type}:${r.target_id}`) ?? null,
    })),
    commentCount: count ?? 0,
    reactionCount: reactionCount ?? 0,
  };
}

/** Visible comment counts for the member's own questions. */
export async function commentCountsFor(questionIds: string[]): Promise<Record<string, number>> {
  if (!questionIds.length || !hasSupabaseAdmin()) return {};
  const { data } = await createAdminClient().from("comments").select("target_id").eq("target_type", "question").in("target_id", questionIds).eq("status", "visible").limit(5000);
  const out: Record<string, number> = {};
  for (const r of data ?? []) out[r.target_id] = (out[r.target_id] ?? 0) + 1;
  return out;
}
