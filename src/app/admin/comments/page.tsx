import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { CommentModeration } from "@/components/admin/comment-moderation";
import { cn, toBnDigits } from "@/lib/utils";

export const metadata: Metadata = { title: "মন্তব্য" };
const PAGE_SIZE = 30;
const FILTERS = [
  { value: "all", label: "সব" },
  { value: "reported", label: "রিপোর্ট হওয়া" },
  { value: "hidden", label: "লুকানো" },
] as const;
const TYPE_LABEL: Record<string, string> = { question: "প্রশ্নোত্তর", article: "প্রবন্ধ", hadith: "হাদীস", lecture: "বয়ান" };

function timeBn(iso: string) {
  return new Date(iso).toLocaleString("bn-BD", { timeZone: "Asia/Dhaka", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export default async function CommentsAdmin({ searchParams }: { searchParams: Promise<{ f?: string; page?: string }> }) {
  await requireRole("editor", "/admin/comments");
  const sp = await searchParams;
  const f = FILTERS.some((x) => x.value === sp.f) ? sp.f! : "all";
  const page = Math.max(1, Number(sp.page) || 1);
  const db = createAdminClient();

  const { data: reports } = await db.from("comment_reports").select("comment_id, reason").limit(2000);
  const reportMap = new Map<string, string[]>();
  for (const r of reports ?? []) reportMap.set(r.comment_id, [...(reportMap.get(r.comment_id) ?? []), r.reason ?? ""]);

  let q = db.from("comments").select("id, target_type, target_id, parent_id, author_id, body, status, created_at", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (f === "hidden") q = q.eq("status", "hidden");
  if (f === "reported") {
    const ids = [...reportMap.keys()];
    q = q.in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  }
  const { data, count } = await q;
  const rows = data ?? [];

  // Author names and links to the posts.
  const authorIds = [...new Set(rows.map((r) => r.author_id))];
  const byType = (t: string) => [...new Set(rows.filter((r) => r.target_type === t).map((r) => r.target_id))];
  const [authors, qs, as, ls] = await Promise.all([
    authorIds.length ? db.from("profiles").select("id, display_name").in("id", authorIds) : Promise.resolve({ data: [] as { id: string; display_name: string | null }[] }),
    byType("question").length ? db.from("questions").select("id, slug, title").in("id", byType("question")) : Promise.resolve({ data: [] as { id: string; slug: string; title: string }[] }),
    byType("article").length ? db.from("articles").select("id, slug, title").in("id", byType("article")) : Promise.resolve({ data: [] as { id: string; slug: string; title: string }[] }),
    byType("lecture").length ? db.from("lectures").select("id, slug, title").in("id", byType("lecture")) : Promise.resolve({ data: [] as { id: string; slug: string; title: string }[] }),
  ]);
  const author = new Map((authors.data ?? []).map((a) => [a.id, a]));
  const post = new Map<string, { href: string; title: string }>();
  for (const x of qs.data ?? []) post.set(`question:${x.id}`, { href: `/qa/${x.slug}`, title: x.title });
  for (const x of as.data ?? []) post.set(`article:${x.id}`, { href: `/articles/${x.slug}`, title: x.title });
  for (const x of ls.data ?? []) post.set(`lecture:${x.id}`, { href: `/lectures/${x.slug}`, title: x.title });
  const postOf = (t: string, id: string) => (t === "hadith" ? { href: `/hadith/${id}`, title: `হাদীস ${toBnDigits(id)}` } : post.get(`${t}:${id}`));

  const pageCount = Math.ceil((count ?? 0) / PAGE_SIZE);
  return (
    <>
      <PageHeader title="মন্তব্য" description="পাঠকদের মন্তব্য দেখুন, রিপোর্ট হওয়া মন্তব্য যাচাই করুন, প্রয়োজনে লুকিয়ে রাখুন বা মুছে ফেলুন।" />
      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map((x) => (
          <Link key={x.value} href={`/admin/comments?f=${x.value}`} className={cn("rounded-full border px-3.5 py-1 text-sm", f === x.value ? "border-primary bg-primary text-white" : "bg-card hover:border-accent")}>
            {x.label}
            {x.value === "reported" && reportMap.size > 0 && <span className="ml-1.5 rounded-full bg-destructive px-1.5 text-xs text-white">{toBnDigits(reportMap.size)}</span>}
          </Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">এই তালিকায় কোনো মন্তব্য নেই।</p>
      ) : (
        <ol className="divide-y overflow-hidden rounded-xl border bg-card shadow-sm">
          {rows.map((r) => {
            const a = author.get(r.author_id);
            const p = postOf(r.target_type, r.target_id);
            const reps = reportMap.get(r.id);
            return (
              <li key={r.id} className={cn("space-y-2 px-4 py-3 text-sm", r.status === "hidden" && "bg-muted/40")}>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{a?.display_name || "পাঠক"}</span>
                  <span>· {timeBn(r.created_at)}</span>
                  {r.parent_id && <span>· উত্তর</span>}
                  {r.status === "hidden" && <span className="rounded bg-amber-100 px-1.5 text-amber-800">লুকানো</span>}
                  {reps && <span className="rounded bg-destructive/10 px-1.5 text-destructive">রিপোর্ট {toBnDigits(reps.length)}</span>}
                </div>
                <p className="whitespace-pre-line break-words">{r.body}</p>
                {reps && reps.some(Boolean) && <p className="text-xs text-destructive">কারণ: {reps.filter(Boolean).join(" · ")}</p>}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {TYPE_LABEL[r.target_type]}:{" "}
                    {p ? <Link href={`${p.href}#comments`} target="_blank" className="text-primary hover:underline">{p.title}</Link> : "অপ্রকাশিত/মুছে ফেলা পোস্ট"}
                  </span>
                  <CommentModeration id={r.id} hidden={r.status === "hidden"} reported={Boolean(reps)} />
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <Pagination page={page} pageCount={pageCount} makeHref={(n) => `/admin/comments?f=${f}&page=${n}`} />
    </>
  );
}
