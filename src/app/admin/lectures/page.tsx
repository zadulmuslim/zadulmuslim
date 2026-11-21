import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/page-header";
import { RowActions } from "@/components/admin/row-actions";
import { StatusBadge } from "@/components/admin/status-badge";
import { deleteLecture } from "@/app/actions/admin/library";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { formatBnDate } from "@/lib/format";

export const metadata: Metadata = { title: "বয়ান" };
const KIND = { video: "ভিডিও", audio: "অডিও", nasheed: "হামদ-নাত" } as const;

export default async function AdminLectures({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const { deleted } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("lectures").select("id, title, slug, speaker, kind, status, updated_at").order("updated_at", { ascending: false }).limit(200);
  return (
    <>
      <PageHeader title="বয়ান ও ভিডিও" description="YouTube লিংক বা অডিও-ভিডিও ফাইল দিয়ে বয়ান যোগ করুন।" />
      <div className="mb-4 flex justify-end">
        <Button asChild><Link href="/admin/lectures/new"><Plus />নতুন বয়ান</Link></Button>
      </div>
      {deleted && <FormMessage state={{ ok: true, message: "বয়ানটি মুছে ফেলা হয়েছে।" }} className="mb-4" />}
      {data?.length ? (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-sm">
          {data.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <Link href={`/admin/lectures/${l.id}`} className="font-medium hover:text-primary">{l.title}</Link>
                <p className="text-xs text-muted-foreground">{KIND[l.kind]}{l.speaker ? ` · ${l.speaker}` : ""} · {formatBnDate(l.updated_at)}</p>
              </div>
              <StatusBadge status={l.status} />
              <RowActions id={l.id} editHref={`/admin/lectures/${l.id}`} deleteAction={deleteLecture} confirmTitle="এই বয়ানটি মুছে ফেলবেন?" confirmText={`“${l.title}” স্থায়ীভাবে মুছে যাবে।`} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border bg-card px-4 py-10 text-center text-sm text-muted-foreground">এখনো কোনো বয়ান যোগ করা হয়নি।</p>
      )}
    </>
  );
}
