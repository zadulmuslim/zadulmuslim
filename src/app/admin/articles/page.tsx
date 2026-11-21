import type { Metadata } from "next";
import Link from "next/link";
import { FilePlus2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Pagination } from "@/components/admin/pagination";
import { RowActions } from "@/components/admin/row-actions";
import { deleteArticle } from "@/app/actions/admin/articles";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { formatBnDate } from "@/lib/format";
import { cn, toBnDigits } from "@/lib/utils";

export const metadata: Metadata = { title: "প্রবন্ধ" };

const TABS = [
  { value: "all", label: "সব" },
  { value: "published", label: "প্রকাশিত" },
  { value: "draft", label: "খসড়া" },
  { value: "archived", label: "আর্কাইভ" },
] as const;
const PAGE_SIZE = 20;

export default async function AdminArticles({ searchParams }: { searchParams: Promise<{ status?: string; page?: string; deleted?: string }> }) {
  const sp = await searchParams;
  const status = TABS.some((t) => t.value === sp.status) ? sp.status! : "all";
  const page = Math.max(1, Number(sp.page) || 1);

  const supabase = await createClient();
  let query = supabase
    .from("articles")
    .select("id, title, status, updated_at, reading_minutes, article_categories(name_bn)", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (status !== "all") query = query.eq("status", status as "draft");
  const { data, count } = await query;

  return (
    <>
      <PageHeader
        title="প্রবন্ধ"
        actions={<Button asChild size="sm"><Link href="/admin/articles/new"><FilePlus2 />নতুন প্রবন্ধ</Link></Button>}
      />
      {sp.deleted && <FormMessage state={{ ok: true, message: "প্রবন্ধটি মুছে ফেলা হয়েছে।" }} className="mb-4" />}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <Link key={t.value} href={`/admin/articles?status=${t.value}`} className={cn("rounded-full border px-3.5 py-1 text-sm", status === t.value ? "border-primary bg-primary text-white" : "bg-card hover:border-accent")}>
            {t.label}
          </Link>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {data?.length ? (
          <ul className="divide-y">
            {data.map((a) => (
              <li key={a.id} className="flex flex-col gap-2 px-5 py-3 hover:bg-secondary/40 sm:flex-row sm:items-center sm:justify-between">
                <Link href={`/admin/articles/${a.id}`} className="min-w-0 flex-1">
                  <span className="block truncate font-medium hover:text-primary">{a.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {a.article_categories?.name_bn ?? "বিষয় নেই"} · পড়তে {toBnDigits(a.reading_minutes ?? 1)} মিনিট · হালনাগাদ {formatBnDate(a.updated_at)}
                  </span>
                </Link>
                <div className="flex items-center gap-3">
                  <StatusBadge status={a.status} />
                  <RowActions id={a.id} editHref={`/admin/articles/${a.id}`} deleteAction={deleteArticle} confirmText="এই প্রবন্ধটি স্থায়ীভাবে মুছে ফেলবেন?" />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">কোনো প্রবন্ধ নেই। প্রথম প্রবন্ধটি লিখে শুরু করুন।</p>
        )}
      </div>
      <Pagination page={page} pageCount={Math.ceil((count ?? 0) / PAGE_SIZE)} makeHref={(p) => `/admin/articles?status=${status}&page=${p}`} />
    </>
  );
}
