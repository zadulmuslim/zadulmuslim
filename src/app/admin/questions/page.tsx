import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquarePlus } from "lucide-react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { ListFilters } from "@/components/admin/list-filters";
import { BulkList } from "@/components/admin/bulk-list";
import { bulkQuestions, deleteQuestion } from "@/app/actions/admin/questions";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { formatBnDate } from "@/lib/format";
import { toBnDigits } from "@/lib/utils";

export const metadata: Metadata = { title: "প্রশ্নোত্তর" };

const TABS = [
  { value: "pending", label: "অপেক্ষমাণ" },
  { value: "in_review", label: "পর্যালোচনায়" },
  { value: "answered", label: "প্রকাশিত" },
  { value: "rejected", label: "বাতিল" },
  { value: "all", label: "সব" },
] as const;
const PAGE_SIZE = 25;

type SP = Promise<{ status?: string; q?: string; page?: string; deleted?: string; category?: string }>;

export default async function AdminQuestions({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const status = TABS.some((t) => t.value === sp.status) ? sp.status! : "pending";
  const page = Math.max(1, Number(sp.page) || 1);
  const q = (sp.q ?? "").trim().slice(0, 100);
  const category = z.uuid().safeParse(sp.category).success ? sp.category! : "";

  const supabase = await createClient();
  const { data: categories } = await supabase.from("question_categories").select("id, name_bn").order("sort_order");
  let query = supabase
    .from("questions")
    .select("id, title, status, slug, is_public, created_at, question_categories(name_bn)", { count: "exact" })
    .order(status === "pending" ? "created_at" : "updated_at", { ascending: status === "pending" })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (status !== "all") query = query.eq("status", status as "pending");
  if (q) query = query.ilike("title", `%${q.replace(/[%_]/g, "")}%`);
  if (category) query = query.eq("category_id", category);
  const { data, count } = await query;

  const qs = (p: number) => {
    const params = new URLSearchParams({ status, page: String(p) });
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    return `/admin/questions?${params}`;
  };

  return (
    <>
      <PageHeader
        title="প্রশ্নোত্তর"
        description={`পাঠকদের প্রশ্নের উত্তর দিন, অথবা প্রশ্নোত্তর সরাসরি যোগ করুন। এই তালিকায় ${toBnDigits(count ?? 0)}টি।`}
        actions={<Button asChild size="sm"><Link href="/admin/questions/new"><MessageSquarePlus />নতুন প্রশ্নোত্তর</Link></Button>}
      />
      {sp.deleted && <FormMessage state={{ ok: true, message: "মুছে ফেলা হয়েছে।" }} className="mb-4" />}
      <ListFilters basePath="/admin/questions" tabs={TABS} status={status} q={q} category={category} categories={categories ?? []} />
      <BulkList
        noun="প্রশ্ন"
        rows={(data ?? []).map((r) => ({
          id: r.id,
          title: r.title,
          status: r.status,
          editHref: `/admin/questions/${r.id}`,
          viewHref: r.status === "answered" && r.is_public && r.slug ? `/qa/${r.slug}` : null,
          meta: `${r.question_categories?.name_bn ?? "বিষয় নির্ধারিত হয়নি"} · ${formatBnDate(r.created_at)}${r.is_public ? "" : " · 🔒 শুধু প্রশ্নকারীর জন্য"}`,
        }))}
        ops={[
          { value: "publish", label: "উত্তর প্রকাশ করুন" },
          { value: "unpublish", label: "প্রকাশ বন্ধ করুন" },
          { value: "category", label: "বিষয় পরিবর্তন" },
          { value: "reject", label: "বাতিল করুন" },
          { value: "delete", label: "মুছে ফেলুন", danger: true },
        ]}
        categories={categories ?? []}
        bulkAction={bulkQuestions}
        deleteAction={deleteQuestion}
        emptyText="এখানে কোনো প্রশ্ন নেই।"
      />
      <Pagination page={page} pageCount={Math.ceil((count ?? 0) / PAGE_SIZE)} makeHref={qs} />
    </>
  );
}
