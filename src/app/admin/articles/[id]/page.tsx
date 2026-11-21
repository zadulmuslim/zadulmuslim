import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { deleteArticle } from "@/app/actions/admin/articles";
import { PageHeader } from "@/components/admin/page-header";
import { EditStatusBar } from "@/components/admin/edit-status-bar";
import { ArticleForm } from "@/components/admin/article-form";
import { formatBnDate } from "@/lib/format";

export const metadata: Metadata = { title: "প্রবন্ধ সম্পাদনা" };

export default async function EditArticle({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params;
  const { saved } = await searchParams;
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const [{ data: a }, { data: categories }] = await Promise.all([
    supabase.from("articles").select("*, media:featured_media_id(id, public_url)").eq("id", id).maybeSingle(),
    supabase.from("article_categories").select("id, name_bn").order("sort_order"),
  ]);
  if (!a) notFound();
  const featured = a.media?.public_url ? { id: a.media.id, url: a.media.public_url } : null;

  return (
    <>
      <PageHeader title="প্রবন্ধ সম্পাদনা" />
      <EditStatusBar
        id={a.id}
        status={a.status}
        details={[`হালনাগাদ: ${formatBnDate(a.updated_at)}`, ...(a.published_at ? [`প্রকাশ: ${formatBnDate(a.published_at)}`] : [])]}
        viewHref={a.status === "published" ? `/articles/${a.slug}` : null}
        deleteAction={deleteArticle}
        confirmText="এই প্রবন্ধটি স্থায়ীভাবে মুছে ফেলবেন?"
      />
      <ArticleForm
        key={a.updated_at}
        values={{ ...a, featured }}
        categories={categories ?? []}
        initialState={saved ? { ok: true, message: "সংরক্ষিত হয়েছে।" } : null}
      />
    </>
  );
}
