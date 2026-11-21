import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/page-header";
import { CategoryRow } from "@/components/admin/category-row";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "বিষয় ব্যবস্থাপনা" };

export default async function AdminCategories({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const type = (await searchParams).type === "article" ? "article" : "question";
  const supabase = await createClient();

  // Post counts come from a separate query: the questions table has column-level
  // grants (asker details are hidden), which breaks PostgREST's embedded count.
  const [cats, posts] = await Promise.all([
    type === "article"
      ? supabase.from("article_categories").select("id, name_bn, slug, description_bn, sort_order").order("sort_order")
      : supabase.from("question_categories").select("id, name_bn, slug, sort_order").order("sort_order"),
    type === "article"
      ? supabase.from("articles").select("category_id")
      : supabase.from("questions").select("category_id"),
  ]);
  const counts = new Map<string, number>();
  for (const p of (posts.data ?? []) as { category_id: string | null }[]) {
    if (p.category_id) counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);
  }
  const rows = (cats.data ?? []) as { id: string; name_bn: string; slug: string; sort_order: number; description_bn?: string | null }[];
  if (cats.error) console.error("[admin/categories]", cats.error.message);

  return (
    <>
      <PageHeader title="বিষয় ব্যবস্থাপনা" description="প্রশ্নোত্তর ও প্রবন্ধের বিষয় যোগ, নাম পরিবর্তন, ক্রম ঠিক করা ও মোছা।" />
      <div className="mb-5 flex gap-1.5">
        {(["question", "article"] as const).map((t) => (
          <Link key={t} href={`/admin/categories?type=${t}`} className={cn("rounded-full border px-4 py-1.5 text-sm", type === t ? "border-primary bg-primary text-white" : "bg-card hover:border-accent")}>
            {t === "question" ? "প্রশ্নোত্তরের বিষয়" : "প্রবন্ধের বিষয়"}
          </Link>
        ))}
      </div>
      <div className="space-y-3">
        {cats.error && (
          <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            বিষয়ের তালিকা লোড করা যায়নি। পেজটি আবার লোড করুন।
          </p>
        )}
        {!cats.error && rows.length === 0 && <p className="rounded-xl border bg-card px-4 py-6 text-center text-sm text-muted-foreground">এখনো কোনো বিষয় যোগ করা হয়নি।</p>}
        {rows.map((r) => (
          <CategoryRow key={r.id} type={type} values={{ ...r, description_bn: r.description_bn ?? null, count: counts.get(r.id) ?? 0 }} />
        ))}
        <p className="pt-3 text-sm font-semibold text-primary">নতুন বিষয় যোগ করুন</p>
        <CategoryRow type={type} />
      </div>
    </>
  );
}
