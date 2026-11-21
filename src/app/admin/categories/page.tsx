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

  const rows =
    type === "article"
      ? (await supabase.from("article_categories").select("id, name_bn, slug, description_bn, sort_order, articles(count)").order("sort_order")).data
      : (await supabase.from("question_categories").select("id, name_bn, slug, sort_order, questions(count)").order("sort_order")).data;

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
        {(rows ?? []).map((r) => {
          const rel = (r as { articles?: { count: number }[]; questions?: { count: number }[] });
          const count = (rel.articles ?? rel.questions)?.[0]?.count ?? 0;
          return (
            <CategoryRow
              key={r.id}
              type={type}
              values={{ ...r, description_bn: "description_bn" in r ? (r.description_bn as string | null) : null, count }}
            />
          );
        })}
        <p className="pt-3 text-sm font-semibold text-primary">নতুন বিষয় যোগ করুন</p>
        <CategoryRow type={type} />
      </div>
    </>
  );
}
