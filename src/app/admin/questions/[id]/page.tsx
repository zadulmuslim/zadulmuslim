import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdmin } from "@/lib/env";
import { deleteQuestion } from "@/app/actions/admin/questions";
import { PageHeader } from "@/components/admin/page-header";
import { ConfirmDeleteForm } from "@/components/admin/row-actions";
import { StatusBadge } from "@/components/admin/status-badge";
import { QuestionForm } from "@/components/admin/question-form";
import { formatBnDate } from "@/lib/format";

export const metadata: Metadata = { title: "প্রশ্ন সম্পাদনা" };

export default async function EditQuestion({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  await requireStaff();
  const { id } = await params;
  const { saved } = await searchParams;
  if (!z.uuid().safeParse(id).success) notFound();

  // Asker contact details are hidden from normal reads; staff see them via the
  // service role. Without that key the page still works, just without the email.
  const supabase = await createClient();
  const PUBLIC_COLUMNS =
    "id, slug, title, question, answer, category_id, asker_id, status, is_public, answered_by, answered_at, published_at, created_at, updated_at";
  const q = hasSupabaseAdmin()
    ? (await createAdminClient().from("questions").select("*").eq("id", id).maybeSingle()).data
    : (await supabase.from("questions").select(PUBLIC_COLUMNS).eq("id", id).maybeSingle()).data;
  if (!q) notFound();
  const askerEmail = "asker_email" in q ? (q.asker_email as string | null) : null;
  const { data: categories } = await supabase.from("question_categories").select("id, name_bn").order("sort_order");

  return (
    <>
      <PageHeader
        title="প্রশ্ন ও উত্তর"
        description={`জমা: ${formatBnDate(q.created_at)}${q.answered_at ? ` · উত্তর: ${formatBnDate(q.answered_at)}` : ""}`}
        actions={
          <>
            <StatusBadge status={q.status} />
            <ConfirmDeleteForm id={q.id} action={deleteQuestion} confirmText="এই প্রশ্নোত্তরটি স্থায়ীভাবে মুছে ফেলবেন?" />
          </>
        }
      />
      {(askerEmail || q.asker_id) && (
        <p className="mb-5 rounded-lg border border-dashed bg-secondary/40 px-4 py-2 text-xs text-muted-foreground">
          প্রশ্নকারী (শুধু সম্পাদকরা দেখেন): {askerEmail ?? "নিবন্ধিত ব্যবহারকারী"} — এই তথ্য কখনো প্রকাশ করবেন না।
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
