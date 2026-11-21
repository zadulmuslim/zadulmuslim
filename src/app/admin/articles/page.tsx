import type { Metadata } from "next";
import Link from "next/link";
import { FilePlus2 } from "lucide-react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { ListFilters } from "@/components/admin/list-filters";
import { BulkList } from "@/components/admin/bulk-list";
import { bulkArticles, deleteArticle } from "@/app/actions/admin/articles";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { formatBnDate } from "@/lib/format";
import { toBnDigits } from "@/lib/utils";

export const metadata: Metadata = { title: "প্রবন্ধ" };

const TABS = [
  { value: "all", label: "সব" },
  { value: "published", label: "প্রকাশিত" },
  { value: "draft", label: "খসড়া" },
  { value: "archived", label: "আর্কাইভ" },
] as const;
const PAGE_SIZE = 25;

export default async function AdminArticles({ searchParams }: { searchParams: Promise<{ status?: string; page?: string; deleted?: string; q?: string; category?: string }> }) {
  const sp = await searchParams;
  const status = TABS.some((t) => t.value === sp.status) ? sp.status! : "all";
  const page = Math.max(1, Number(sp.page) || 1);
  const q = (sp.q ?? "").trim().slice(0, 100);
  const category = z.uuid().safeParse(sp.category).success ? sp.category! : "";

  const supabase = await createClient();
  const { data: categories } = await supabase.from("article_categories").select("id, name_bn").order("sort_order");
  let query = supabase
    .from("articles")
    .select("id, title, slug, status, updated_at, reading_minutes, author_name, article_categories(name_bn)", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (status !== "all") query = query.eq("status", status as "draft");
  if (q) query = query.ilike("title", `%${q.replace(/[%_]/g, "")}%`);
  if (category) query = query.eq("category_id", category);
  const { data, count } = await query;

  const qs = (p: number) => {
    const params = new URLSearchParams({ status, page: String(p) });
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    return `/admin/articles?${params}`;
  };

  return (
    <>
      <PageHeader
        title="প্রবন্ধ"
        description={`এই তালিকায় ${toBnDigits(count ?? 0)}টি প্রবন্ধ।`}
        actions={<Button asChild size="sm"><Link href="/admin/articles/new"><FilePlus2 />নতুন প্রবন্ধ</Link></Button>}
      />
      {sp.deleted && <FormMessage state={{ ok: true, message: "প্রবন্ধটি মুছে ফেলা হয়েছে।" }} className="mb-4" />}
      <ListFilters basePath="/admin/articles" tabs={TABS} status={status} q={q} category={category} categories={categories ?? []} />
      <BulkList
        noun="প্রবন্ধ"
        rows={(data ?? []).map((a) => ({
          id: a.id,
          title: a.title,
          status: a.status,
          editHref: `/admin/articles/${a.id}`,
          viewHref: a.status === "published" ? `/articles/${a.slug}` : null,
          meta: `${a.article_categories?.name_bn ?? "বিষয় নেই"}${a.author_name ? ` · ${a.author_name}` : ""} · পড়তে ${toBnDigits(a.reading_minutes ?? 1)} মিনিট · হালনাগাদ ${formatBnDate(a.updated_at)}`,
        }))}
        ops={[
          { value: "publish", label: "প্রকাশ করুন" },
          { value: "draft", label: "খসড়ায় ফেরান" },
          { value: "category", label: "বিষয় পরিবর্তন" },
          { value: "archive", label: "আর্কাইভ করুন" },
          { value: "delete", label: "মুছে ফেলুন", danger: true },
        ]}
        categories={categories ?? []}
        bulkAction={bulkArticles}
        deleteAction={deleteArticle}
        emptyText="কোনো প্রবন্ধ নেই। প্রথম প্রবন্ধটি লিখে শুরু করুন।"
      />
      <Pagination page={page} pageCount={Math.ceil((count ?? 0) / PAGE_SIZE)} makeHref={qs} />
    </>
  );
}
