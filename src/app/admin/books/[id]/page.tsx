import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { deleteBook } from "@/app/actions/admin/library";
import { PageHeader } from "@/components/admin/page-header";
import { EditStatusBar } from "@/components/admin/edit-status-bar";
import { BookForm } from "@/components/admin/library-forms";
import { mediaRefs } from "@/lib/media-lookup";
import { formatBnDate } from "@/lib/format";

export const metadata: Metadata = { title: "বই সম্পাদনা" };

export default async function EditBook({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params;
  const { saved } = await searchParams;
  if (!z.uuid().safeParse(id).success) notFound();
  const supabase = await createClient();
  const [{ data: b }, { data: all }] = await Promise.all([
    supabase.from("books").select("*").eq("id", id).maybeSingle(),
    supabase.from("books").select("subject").not("subject", "is", null).limit(500),
  ]);
  if (!b) notFound();
  const m = await mediaRefs(supabase, [b.cover_media_id, b.file_media_id]);
  return (
    <>
      <PageHeader title="বই সম্পাদনা" />
      <EditStatusBar
        id={b.id}
        status={b.status}
        details={[`হালনাগাদ: ${formatBnDate(b.updated_at)}`, ...(b.published_at ? [`প্রকাশ: ${formatBnDate(b.published_at)}`] : [])]}
        viewHref={b.status === "published" ? `/library/${b.slug}` : null}
        deleteAction={deleteBook}
        confirmText="এই বইটি মুছে ফেলবেন?"
      />
      <BookForm
        key={b.updated_at}
        values={{ ...b, cover: (b.cover_media_id && m[b.cover_media_id]) || null, file: (b.file_media_id && m[b.file_media_id]) || null }}
        subjects={[...new Set((all ?? []).map((x) => x.subject!))]}
        initialState={saved ? { ok: true, message: "সংরক্ষিত হয়েছে।" } : null}
      />
    </>
  );
}
