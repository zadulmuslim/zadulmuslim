import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteQuestion } from "@/app/actions/admin/questions";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { QuestionForm } from "@/components/admin/question-form";
import { Button } from "@/components/ui/button";
import { formatBnDate } from "@/lib/format";

export const metadata: Metadata = { title: "প্রশ্ন সম্পাদনা" };

export default async function EditQuestion({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  await requireStaff();
  const { id } = await params;
  const { saved } = await searchParams;
  if (!z.uuid().safeParse(id).success) notFound();

  // Asker contact details are hidden from normal reads; staff see them via the service role.
  const admin = createAdminClient();
  const { data: q } = await admin.from("questions").select("*").eq("id", id).maybeSingle();
  if (!q) notFound();
  const supabase = await createClient();
  const { data: categories } = await supabase.from("question_categories").select("id, name_bn").order("sort_order");

  return (
    <>
      <PageHeader
        title="প্রশ্ন ও উত্তর"
        description={`জমা: ${formatBnDate(q.created_at)}${q.answered_at ? ` · উত্তর: ${formatBnDate(q.answered_at)}` : ""}`}
        actions={
          <>
            <StatusBadge status={q.status} />
            <form action={deleteQuestion}>
              <input type="hidden" name="id" value={q.id} />
              <Button type="submit" size="sm" variant="ghost" className="text-destructive hover:bg-destructive/5"><Trash2 />মুছুন</Button>
            </form>
          </>
        }
      />
      {(q.asker_email || q.asker_id) && (
        <p className="mb-5 rounded-lg border border-dashed bg-secondary/40 px-4 py-2 text-xs text-muted-foreground">
          প্রশ্নকারী (শুধু সম্পাদকরা দেখেন): {q.asker_email ?? "নিবন্ধিত ব্যবহারকারী"} — এই তথ্য কখনো প্রকাশ করবেন না।
        </p>
      )}
      <QuestionForm
        key={q.updated_at}
        values={q}
        categories={categories ?? []}
        initialState={saved ? { ok: true, message: "সংরক্ষিত হয়েছে।" } : null}
      />
    </>
  );
}
