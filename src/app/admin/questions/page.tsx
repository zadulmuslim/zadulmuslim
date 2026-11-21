import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquarePlus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Pagination } from "@/components/admin/pagination";
import { RowActions } from "@/components/admin/row-actions";
import { deleteQuestion } from "@/app/actions/admin/questions";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { formatBnDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "প্রশ্নোত্তর" };

const TABS = [
  { value: "pending", label: "অপেক্ষমাণ" },
  { value: "in_review", label: "পর্যালোচনায়" },
  { value: "answered", label: "প্রকাশিত" },
  { value: "rejected", label: "বাতিল" },
  { value: "all", label: "সব" },
] as const;
const PAGE_SIZE = 20;

type SP = Promise<{ status?: string; q?: string; page?: string; deleted?: string }>;

export default async function AdminQuestions({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const status = TABS.some((t) => t.value === sp.status) ? sp.status! : "pending";
  const page = Math.max(1, Number(sp.page) || 1);
  const q = (sp.q ?? "").trim().slice(0, 100);

  const supabase = await createClient();
  let query = supabase
    .from("questions")
    .select("id, title, status, created_at, published_at, question_categories(name_bn)", { count: "exact" })
    .order(status === "pending" ? "created_at" : "updated_at", { ascending: status === "pending" })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (status !== "all") query = query.eq("status", status as "pending");
  if (q) query = query.ilike("title", `%${q.replace(/[%_]/g, "")}%`);
  const { data, count } = await query;

  const href = (p: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    const merged = { status, q: q || undefined, ...p };
    Object.entries(merged).forEach(([k, v]) => v !== undefined && v !== "" && params.set(k, String(v)));
    return `/admin/questions?${params}`;
  };

  return (
    <>
      <PageHeader
        title="প্রশ্নোত্তর"
        description="পাঠকদের প্রশ্নের উত্তর দিন, অথবা আগের প্রশ্নোত্তর সরাসরি যোগ করুন।"
        actions={<Button asChild size="sm"><Link href="/admin/questions/new"><MessageSquarePlus />নতুন প্রশ্নোত্তর</Link></Button>}
      />
      {sp.deleted && <FormMessage state={{ ok: true, message: "মুছে ফেলা হয়েছে।" }} className="mb-4" />}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <Link
              key={t.value}
              href={href({ status: t.value, page: undefined })}
              className={cn("rounded-full border px-3.5 py-1 text-sm", status === t.value ? "border-primary bg-primary text-white" : "bg-card hover:border-accent")}
            >
              {t.label}
            </Link>
          ))}
        </div>
        <form className="flex items-center gap-2" action="/admin/questions">
          <input type="hidden" name="status" value={status} />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input name="q" defaultValue={q} placeholder="শিরোনামে খুঁজুন…" className="h-9 w-56 rounded-full border bg-card pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {data?.length ? (
          <ul className="divide-y">
            {data.map((row) => (
              <li key={row.id} className="flex flex-col gap-2 px-5 py-3 hover:bg-secondary/40 sm:flex-row sm:items-center sm:justify-between">
                <Link href={`/admin/questions/${row.id}`} className="min-w-0 flex-1">
                  <span className="block truncate font-medium hover:text-primary">{row.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {row.question_categories?.name_bn ?? "বিষয় নির্ধারিত হয়নি"} · {formatBnDate(row.created_at)}
                  </span>
                </Link>
                <div className="flex items-center gap-3">
                  <StatusBadge status={row.status} />
                  <RowActions id={row.id} editHref={`/admin/questions/${row.id}`} deleteAction={deleteQuestion} confirmText="এই প্রশ্নোত্তরটি স্থায়ীভাবে মুছে ফেলবেন?" />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">এখানে কোনো প্রশ্ন নেই।</p>
        )}
      </div>
      <Pagination page={page} pageCount={Math.ceil((count ?? 0) / PAGE_SIZE)} makeHref={(p) => href({ page: p })} />
    </>
  );
}
