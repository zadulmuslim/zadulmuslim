import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/page-header";
import { RowActions } from "@/components/admin/row-actions";
import { StatusBadge } from "@/components/admin/status-badge";
import { deleteBook } from "@/app/actions/admin/library";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { formatBnDate } from "@/lib/format";

export const metadata: Metadata = { title: "লাইব্রেরি" };

export default async function AdminBooks({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const { deleted } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("books").select("id, title, slug, author_name, subject, status, updated_at").order("updated_at", { ascending: false }).limit(300);
  return (
    <>
      <PageHeader title="লাইব্রেরি" description="বই যোগ করুন — প্রচ্ছদ ও PDF ফাইলসহ।" />
      <div className="mb-4 flex justify-end">
        <Button asChild><Link href="/admin/books/new"><Plus />নতুন বই</Link></Button>
      </div>
      {deleted && <FormMessage state={{ ok: true, message: "বইটি মুছে ফেলা হয়েছে।" }} className="mb-4" />}
      {data?.length ? (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-sm">
          {data.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <Link href={`/admin/books/${b.id}`} className="font-medium hover:text-primary">{b.title}</Link>
                <p className="text-xs text-muted-foreground">{[b.author_name, b.subject].filter(Boolean).join(" · ") || "—"} · {formatBnDate(b.updated_at)}</p>
              </div>
              <StatusBadge status={b.status} />
              <RowActions id={b.id} editHref={`/admin/books/${b.id}`} deleteAction={deleteBook} confirmTitle="এই বইটি মুছে ফেলবেন?" confirmText={`“${b.title}” স্থায়ীভাবে মুছে যাবে।`} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border bg-card px-4 py-10 text-center text-sm text-muted-foreground">এখনো কোনো বই যোগ করা হয়নি।</p>
      )}
    </>
  );
}
