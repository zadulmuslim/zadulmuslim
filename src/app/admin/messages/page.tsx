import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { MessageActions } from "@/components/admin/message-actions";
import { TOPIC_LABEL } from "@/config/contact";
import { cn, toBnDigits } from "@/lib/utils";

export const metadata: Metadata = { title: "বার্তা" };
const PAGE_SIZE = 20;
const FILTERS = [
  { value: "inbox", label: "ইনবক্স" },
  { value: "new", label: "নতুন" },
  { value: "replied", label: "উত্তর দেওয়া" },
  { value: "archived", label: "আর্কাইভ" },
] as const;
const STATUS: Record<string, { label: string; cls: string }> = {
  new: { label: "নতুন", cls: "bg-accent/20 text-brand-deep" },
  read: { label: "পড়া হয়েছে", cls: "bg-muted text-muted-foreground" },
  replied: { label: "উত্তর দেওয়া", cls: "bg-primary/10 text-primary" },
  archived: { label: "আর্কাইভ", cls: "bg-muted text-muted-foreground" },
};

export default async function MessagesAdmin({ searchParams }: { searchParams: Promise<{ f?: string; page?: string }> }) {
  await requireRole("editor", "/admin/messages");
  const sp = await searchParams;
  const f = FILTERS.some((x) => x.value === sp.f) ? sp.f! : "inbox";
  const page = Math.max(1, Number(sp.page) || 1);
  const db = createAdminClient();

  let q = db.from("contact_messages").select("*", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  q = f === "inbox" ? q.in("status", ["new", "read"]) : q.eq("status", f);
  const [{ data, count }, { count: newCount }] = await Promise.all([
    q,
    db.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);
  const rows = data ?? [];
  const when = (iso: string) => new Date(iso).toLocaleString("bn-BD", { timeZone: "Asia/Dhaka", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <>
      <PageHeader title="বার্তা" description="যোগাযোগ পাতা থেকে আসা বার্তা। “উত্তর দিন” চাপলে প্রেরকের ইমেইলে উত্তর লেখার জানালা খুলবে।" />
      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map((x) => (
          <Link key={x.value} href={`/admin/messages?f=${x.value}`} className={cn("rounded-full border px-3.5 py-1 text-sm", f === x.value ? "border-primary bg-primary text-white" : "bg-card hover:border-accent")}>
            {x.label}
            {x.value === "new" && (newCount ?? 0) > 0 && <span className="ml-1.5 rounded-full bg-accent px-1.5 text-xs font-bold text-brand-deep">{toBnDigits(newCount ?? 0)}</span>}
          </Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">এই তালিকায় কোনো বার্তা নেই।</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((m) => {
            const st = STATUS[m.status] ?? STATUS.read!;
            return (
              <li key={m.id} className={cn("rounded-xl border bg-card p-4 shadow-sm", m.status === "new" && "border-l-4 border-l-accent")}>
                <details open={m.status === "new"} className="group">
                  <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={cn("font-semibold", m.status === "new" && "text-primary")}>{m.subject}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {m.name} · <span dir="ltr">{m.email}</span> · {TOPIC_LABEL[m.topic] ?? m.topic} · {when(m.created_at)}
                      </p>
                    </div>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", st.cls)}>{st.label}</span>
                  </summary>
                  <p className="mt-3 whitespace-pre-line break-words rounded-lg bg-muted/50 p-3 text-sm leading-relaxed">{m.message}</p>
                  {m.page_url && <p className="mt-2 text-xs text-muted-foreground">সংশ্লিষ্ট পাতা: <Link href={m.page_url} target="_blank" className="text-primary hover:underline">{m.page_url}</Link></p>}
                  <div className="mt-3"><MessageActions id={m.id} status={m.status} email={m.email} subject={m.subject} /></div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
      <Pagination page={page} pageCount={Math.ceil((count ?? 0) / PAGE_SIZE)} makeHref={(n) => `/admin/messages?f=${f}&page=${n}`} />
    </>
  );
}
