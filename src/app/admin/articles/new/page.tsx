import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/page-header";
import { ArticleForm } from "@/components/admin/article-form";

export const metadata: Metadata = { title: "নতুন প্রবন্ধ" };

export default async function NewArticle() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("article_categories").select("id, name_bn").order("sort_order");
  return (
    <>
      <PageHeader title="নতুন প্রবন্ধ" />
      <ArticleForm categories={categories ?? []} />
    </>
  );
}
