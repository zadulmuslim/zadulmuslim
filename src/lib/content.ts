import "server-only";
import { cache } from "react";
import { publicDb } from "@/lib/supabase/public";

/** Public content queries (published only — RLS enforces it too). */

export const QA_COLUMNS = "id, slug, title, question, answer, published_at, answered_at, category_id, question_categories(name_bn, slug)" as const;

export const getQuestionCategories = cache(async () => {
  const db = publicDb();
  if (!db) return [];
  const { data } = await db.from("question_categories").select("id, slug, name_bn, sort_order").order("sort_order");
  return data ?? [];
});

export const getArticleCategories = cache(async () => {
  const db = publicDb();
  if (!db) return [];
  const { data } = await db.from("article_categories").select("id, slug, name_bn, description_bn, sort_order").order("sort_order");
  return data ?? [];
});

export async function listQuestions(opts: { categoryId?: string; q?: string; page?: number; pageSize?: number }) {
  const db = publicDb();
  if (!db) return { rows: [], count: 0 };
  const size = opts.pageSize ?? 20;
  const page = Math.max(1, opts.page ?? 1);
  let query = db
    .from("questions")
    .select("id, slug, title, published_at, question_categories(name_bn, slug)", { count: "exact" })
    .eq("status", "answered")
    .eq("is_public", true)
    .order("published_at", { ascending: false })
    .range((page - 1) * size, page * size - 1);
  if (opts.categoryId) query = query.eq("category_id", opts.categoryId);
  if (opts.q) {
    const term = opts.q.replace(/[%_,()]/g, " ").trim();
    query = query.or(`title.ilike.%${term}%,question.ilike.%${term}%,answer.ilike.%${term}%`);
  }
  const { data, count } = await query;
  return { rows: data ?? [], count: count ?? 0 };
}

export const getQuestionBySlug = cache(async (slug: string) => {
  const db = publicDb();
  if (!db) return null;
  const { data } = await db.from("questions").select(QA_COLUMNS).eq("slug", slug).eq("status", "answered").eq("is_public", true).maybeSingle();
  return data;
});

export async function relatedQuestions(categoryId: string | null, excludeId: string, limit = 5) {
  const db = publicDb();
  if (!db) return [];
  let query = db.from("questions").select("id, slug, title").eq("status", "answered").eq("is_public", true).neq("id", excludeId).order("published_at", { ascending: false }).limit(limit);
  if (categoryId) query = query.eq("category_id", categoryId);
  const { data } = await query;
  return data ?? [];
}

const ARTICLE_LIST_COLUMNS = "id, slug, title, excerpt, author_name, reading_minutes, published_at, article_categories(name_bn, slug), media:featured_media_id(public_url, alt_text)" as const;

export async function listArticles(opts: { categoryId?: string; q?: string; page?: number; pageSize?: number }) {
  const db = publicDb();
  if (!db) return { rows: [], count: 0 };
  const size = opts.pageSize ?? 12;
  const page = Math.max(1, opts.page ?? 1);
  let query = db
    .from("articles")
    .select(ARTICLE_LIST_COLUMNS, { count: "exact" })
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range((page - 1) * size, page * size - 1);
  if (opts.categoryId) query = query.eq("category_id", opts.categoryId);
  if (opts.q) {
    const term = opts.q.replace(/[%_,()]/g, " ").trim();
    query = query.or(`title.ilike.%${term}%,excerpt.ilike.%${term}%,body.ilike.%${term}%`);
  }
  const { data, count } = await query;
  return { rows: data ?? [], count: count ?? 0 };
}

export const getArticleBySlug = cache(async (slug: string) => {
  const db = publicDb();
  if (!db) return null;
  const { data } = await db
    .from("articles")
    .select("id, slug, title, excerpt, body, author_name, reading_minutes, published_at, updated_at, category_id, article_categories(name_bn, slug), media:featured_media_id(public_url, alt_text)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data;
});

export async function relatedArticles(categoryId: string | null, excludeId: string, limit = 3) {
  const db = publicDb();
  if (!db) return [];
  let query = db.from("articles").select(ARTICLE_LIST_COLUMNS).eq("status", "published").neq("id", excludeId).order("published_at", { ascending: false }).limit(limit);
  if (categoryId) query = query.eq("category_id", categoryId);
  const { data } = await query;
  return data ?? [];
}

/** Everything the homepage needs, in parallel. */
export async function getHomepageData() {
  const db = publicDb();
  if (!db) return null;
  const [qCats, aCats, recentQ, allQ, articles, qCount, aCount] = await Promise.all([
    getQuestionCategories(),
    getArticleCategories(),
    db.from("questions").select("slug, title, published_at").eq("status", "answered").eq("is_public", true).order("published_at", { ascending: false }).limit(3),
    db.from("questions").select("slug, title, category_id, published_at").eq("status", "answered").eq("is_public", true).order("published_at", { ascending: false }).limit(200),
    db.from("articles").select("slug, title, category_id, reading_minutes, published_at").eq("status", "published").order("published_at", { ascending: false }).limit(300),
    db.from("questions").select("id", { count: "exact", head: true }).eq("status", "answered").eq("is_public", true),
    db.from("articles").select("id", { count: "exact", head: true }).eq("status", "published"),
  ]);

  const qaGroups = qCats
    .map((c) => ({ ...c, questions: (allQ.data ?? []).filter((q) => q.category_id === c.id).slice(0, 3) }))
    .filter((g) => g.questions.length > 0)
    .slice(0, 4);

  const articleGroups = aCats.map((c) => {
    const inCat = (articles.data ?? []).filter((a) => a.category_id === c.id);
    return { ...c, count: inCat.length, latest: inCat[0] ?? null };
  });

  const stats = {
    questions: qCount.count ?? 0,
    articles: aCount.count ?? 0,
    questionTopics: qCats.length,
    articleTopics: aCats.length,
  };
  return { qaGroups, recent: recentQ.data ?? [], articleGroups, questionCategories: qCats, stats };
}
