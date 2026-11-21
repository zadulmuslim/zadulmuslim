import Link from "next/link";
import { FilePlus2, MessageSquarePlus, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { formatBnDate } from "@/lib/format";
import { toBnDigits } from "@/lib/utils";

export default async function AdminDashboard() {
  const user = await getSessionUser();
  const supabase = await createClient();
  const count = (q: PromiseLike<{ count: number | null }>) => Promise.resolve(q).then((r) => r.count ?? 0);

  const [pending, answered, published, drafts, media, members, recent] = await Promise.all([
    count(supabase.from("questions").select("id", { count: "exact", head: true }).eq("status", "pending")),
    count(supabase.from("questions").select("id", { count: "exact", head: true }).eq("status", "answered")),
    count(supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "published")),
    count(supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "draft")),
    count(supabase.from("media").select("id", { count: "exact", head: true }).eq("status", "ready")),
    count(supabase.from("profiles").select("id", { count: "exact", head: true })),
    supabase.from("questions").select("id, title, status, created_at").in("status", ["pending", "in_review"]).order("created_at", { ascending: true }).limit(6),
  ]);

  const stats = [
    { label: "অপেক্ষমাণ প্রশ্ন", value: pending, href: "/admin/questions?status=pending", highlight: pending > 0 },
    { label: "প্রকাশিত প্রশ্নোত্তর", value: answered, href: "/admin/questions?status=answered" },
    { label: "প্রকাশিত প্রবন্ধ", value: published, href: "/admin/articles?status=published" },
    { label: "খসড়া প্রবন্ধ", value: drafts, href: "/admin/articles?status=draft" },
    { label: "মিডিয়া ফাইল", value: media, href: "/admin/media" },
    { label: "নিবন্ধিত ব্যবহারকারী", value: members, href: user?.role === "admin" ? "/admin/users" : undefined },
  ];

  return (
    <>
      <PageHeader
        title={`আসসালামু আলাইকুম, ${user?.displayName ?? ""}`}
        description="যাদুল মুসলিমের কনটেন্ট এখান থেকে পরিচালনা করুন।"
        actions={
          <>
            <Button asChild size="sm"><Link href="/admin/questions/new"><MessageSquarePlus />নতুন প্রশ্নোত্তর</Link></Button>
            <Button asChild size="sm" variant="outline"><Link href="/admin/articles/new"><FilePlus2 />নতুন প্রবন্ধ</Link></Button>
            <Button asChild size="sm" variant="outline"><Link href="/admin/media"><Upload />আপলোড</Link></Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {stats.map((s) => {
          const body = (
            <>
              <p className={`text-3xl font-bold ${s.highlight ? "text-accent" : "text-primary"}`}>{toBnDigits(s.value)}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </>
          );
          const cls = "rounded-xl border bg-card p-5 shadow-sm";
          return s.href ? (
            <Link key={s.label} href={s.href} className={`${cls} transition hover:border-accent hover:shadow-md`}>{body}</Link>
          ) : (
            <div key={s.label} className={cls}>{body}</div>
          );
        })}
      </div>

      <section className="mt-8 rounded-xl border bg-card shadow-sm">
        <h2 className="border-b px-5 py-3 font-bold text-primary">উত্তরের অপেক্ষায় (পুরোনো আগে)</h2>
        {recent.data?.length ? (
          <ul className="divide-y">
            {recent.data.map((q) => (
              <li key={q.id}>
                <Link href={`/admin/questions/${q.id}`} className="flex items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-secondary/50">
                  <span className="min-w-0 truncate">{q.title}</span>
                  <span className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                    {formatBnDate(q.created_at)} <StatusBadge status={q.status} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">আলহামদুলিল্লাহ, কোনো প্রশ্ন অপেক্ষমাণ নেই।</p>
        )}
      </section>
    </>
  );
}
