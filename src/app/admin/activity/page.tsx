import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "কার্যকলাপের লগ" };
const PAGE_SIZE = 50;

const ENTITIES = [
  { value: "all", label: "সব" },
  { value: "question", label: "প্রশ্নোত্তর" },
  { value: "article", label: "প্রবন্ধ" },
  { value: "media", label: "মিডিয়া" },
  { value: "category", label: "বিষয়" },
  { value: "user", label: "ব্যবহারকারী" },
] as const;

const ICON: Record<string, string> = { question: "❓", article: "✍️", media: "🖼️", category: "🏷️", user: "👤" };

function timeBn(iso: string) {
  return new Date(iso).toLocaleString("bn-BD", { timeZone: "Asia/Dhaka", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export default async function ActivityLog({ searchParams }: { searchParams: Promise<{ entity?: string; page?: string }> }) {
  await requireAdmin("/admin/activity");
  const sp = await searchParams;
  const entity = ENTITIES.some((e) => e.value === sp.entity) ? sp.entity! : "all";
  const page = Math.max(1, Number(sp.page) || 1);

  const supabase = await createClient();
  let query = supabase
    .from("audit_log")
    .select("id, actor_name, action, entity_type, entity_id, summary, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (entity !== "all") query = query.eq("entity_type", entity);
  const { data, count } = await query;

  const linkFor = (type: string, id: string | null) =>
    !id ? null : type === "question" ? `/admin/questions/${id}` : type === "article" ? `/admin/articles/${id}` : null;

  return (
    <>
      <PageHeader title="কার্যকলাপের লগ" description="কে কখন কী প্রকাশ, সম্পাদনা বা মুছেছেন — শুধু অ্যাডমিনরা দেখতে পান।" />
      <div className="mb-4 flex flex-wrap gap-1.5">
        {ENTITIES.map((e) => (
          <Link key={e.value} href={`/admin/activity?entity=${e.value}`} className={cn("rounded-full border px-3.5 py-1 text-sm", entity === e.value ? "border-primary bg-primary text-white" : "bg-card hover:border-accent")}>
            {e.label}
          </Link>
        ))}
      </div>
      <ol className="divide-y overflow-hidden rounded-xl border bg-card shadow-sm">
        {(data ?? []).map((row) => {
          const href = linkFor(row.entity_type, row.entity_id) ;
          return (
            <li key={row.id} className="flex items-start gap-3 px-4 py-3 text-sm">
              <span className="mt-0.5 text-lg" aria-hidden>{ICON[row.entity_type] ?? "•"}</span>
              <div className="min-w-0 flex-1">
                <p>
                  <span className="font-semibold">{row.actor_name ?? "অজানা"}</span>{" "}
                  {href && !row.action.endsWith("delete") ? (
                    <Link href={href} className="text-primary hover:underline">{row.summary}</Link>
                  ) : (
                    <span>{row.summary}</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{timeBn(row.created_at)} · <code className="text-[11px]">{row.action}</code></p>
              </div>
            </li>
          );
        })}
        {!data?.length && <li className="px-5 py-12 text-center text-sm text-muted-foreground">এখনো কোনো কার্যকলাপ নেই।</li>}
      </ol>
      <Pagination page={page} pageCount={Math.ceil((count ?? 0) / PAGE_SIZE)} makeHref={(p) => `/admin/activity?entity=${entity}&page=${p}`} />
    </>
  );
}
