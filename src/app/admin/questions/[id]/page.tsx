import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdmin } from "@/lib/env";
import { deleteQuestion } from "@/app/actions/admin/questions";
import { PageHeader } from "@/components/admin/page-header";
import { EditStatusBar } from "@/components/admin/edit-status-bar";
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
  const priv = q as Partial<{ asker_email: string | null; asker_name: string | null; notify_email: boolean; notified_at: string | null }>;
  const asker = "asker_email" in priv
    ? { email: priv.asker_email ?? null, name: priv.asker_name ?? null, notify: priv.notify_email ?? false, notifiedAt: priv.notified_at ?? null }
    : null;
  const { data: categories } = await supabase.from("question_categories").select("id, name_bn").order("sort_order");

  return (
    <>
      <PageHeader title="প্রশ্ন ও উত্তর" />
      <EditStatusBar
        id={q.id}
        status={q.status}
        details={[`জমা: ${formatBnDate(q.created_at)}`, ...(q.answered_at ? [`উত্তর: ${formatBnDate(q.answered_at)}`] : []), ...(q.is_public ? [] : ["🔒 শুধু প্রশ্নকারীর জন্য"])]}
        viewHref={q.status === "answered" && q.is_public && q.slug ? `/qa/${q.slug}` : null}
        deleteAction={deleteQuestion}
        confirmText="এই প্রশ্নোত্তরটি স্থায়ীভাবে মুছে ফেলবেন?"
      />
      {(asker?.email || q.asker_id) && (
        <div className="mb-5 rounded-xl border border-dashed bg-secondary/40 px-4 py-3 text-sm">
          <p className="text-xs font-semibold text-muted-foreground">প্রশ্নকারী — শুধু সম্পাদকরা দেখেন, কখনো প্রকাশ করবেন না</p>
          <p className="mt-1">
            {asker?.name ?? "নাম দেননি"}
            {asker?.email && <> · <a href={`mailto:${asker.email}`} className="text-primary hover:underline">{asker.email}</a></>}
            {!asker?.email && q.asker_id && " · নিবন্ধিত ব্যবহারকারী"}
          </p>
          {asker?.email && (
            <p className="mt-1 text-xs text-muted-foreground">
              {asker.notifiedAt
                ? `✓ উত্তর প্রকাশের ইমেইল পাঠানো হয়েছে (${formatBnDate(asker.notifiedAt)})`
                : asker.notify
                  ? "উত্তর প্রকাশ করলে প্রশ্নকারীকে ইমেইলে জানানো হবে।"
                  : "প্রশ্নকারী ইমেইল নোটিফিকেশন চাননি।"}
            </p>
          )}
        </div>
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
