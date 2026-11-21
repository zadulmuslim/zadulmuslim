import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { deleteLecture } from "@/app/actions/admin/library";
import { PageHeader } from "@/components/admin/page-header";
import { EditStatusBar } from "@/components/admin/edit-status-bar";
import { LectureForm } from "@/components/admin/library-forms";
import { mediaRefs } from "@/lib/media-lookup";
import { formatBnDate } from "@/lib/format";

export const metadata: Metadata = { title: "বয়ান সম্পাদনা" };

export default async function EditLecture({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params;
  const { saved } = await searchParams;
  if (!z.uuid().safeParse(id).success) notFound();
  const supabase = await createClient();
  const { data: l } = await supabase.from("lectures").select("*").eq("id", id).maybeSingle();
  if (!l) notFound();
  const m = await mediaRefs(supabase, [l.thumbnail_media_id, l.video_media_id, l.audio_media_id]);
  const pick = (mid: string | null) => (mid && m[mid]) || null;
  return (
    <>
      <PageHeader title="বয়ান সম্পাদনা" />
      <EditStatusBar
        id={l.id}
        status={l.status}
        details={[`হালনাগাদ: ${formatBnDate(l.updated_at)}`, ...(l.published_at ? [`প্রকাশ: ${formatBnDate(l.published_at)}`] : [])]}
        viewHref={l.status === "published" ? `/lectures/${l.slug}` : null}
        deleteAction={deleteLecture}
        confirmText="এই বয়ানটি মুছে ফেলবেন?"
      />
      <LectureForm
        key={l.updated_at}
        values={{ ...l, thumbnail: pick(l.thumbnail_media_id), video: pick(l.video_media_id), audio: pick(l.audio_media_id) }}
        initialState={saved ? { ok: true, message: "সংরক্ষিত হয়েছে।" } : null}
      />
    </>
  );
}
