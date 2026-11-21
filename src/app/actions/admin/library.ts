"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { actionUser } from "@/lib/auth/action-guard";
import { slugify } from "@/lib/format";
import { logActivity } from "@/lib/audit";
import { youtubeId } from "@/lib/youtube";
import type { FormState } from "@/components/ui/form-message";

const optionalUuid = z.uuid().optional().or(z.literal("").transform(() => undefined));
const text = (max: number) => z.string().trim().max(max).optional().default("");
const intent = z.enum(["draft", "publish"]);
const STATUS = { draft: "draft", publish: "published" } as const;

function dbError(error: { code?: string } | null, what: string): FormState {
  if (error?.code === "23505") return { ok: false, message: "এই স্লাগ আগেই ব্যবহৃত। অন্য স্লাগ দিন।", fieldErrors: { slug: ["স্লাগটি আগে ব্যবহৃত।"] } };
  return { ok: false, message: `${what} সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।` };
}

/* ───────────── Lectures ───────────── */

const lectureSchema = z.object({
  id: optionalUuid,
  title: z.string().trim().min(3, { message: "শিরোনাম লিখুন।" }).max(250),
  slug: text(120),
  speaker: text(120),
  description: text(5000),
  kind: z.enum(["video", "audio", "nasheed"]),
  external_video_url: text(500),
  duration_min: z.string().optional().default(""),
  thumbnail_media_id: optionalUuid,
  video_media_id: optionalUuid,
  audio_media_id: optionalUuid,
  intent,
});

export async function saveLecture(_prev: FormState, formData: FormData): Promise<FormState> {
  const auth = await actionUser("editor");
  if (!auth.user) return { ok: false, message: auth.error };
  const parsed = lectureSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "তথ্যগুলো ঠিকভাবে পূরণ করুন।", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const d = parsed.data;
  if (d.external_video_url && !youtubeId(d.external_video_url)) {
    return { ok: false, message: "সঠিক YouTube লিংক দিন।", fieldErrors: { external_video_url: ["লিংকটি চেনা যায়নি।"] } };
  }
  if (d.intent === "publish" && !d.external_video_url && !d.video_media_id && !d.audio_media_id) {
    return { ok: false, message: "প্রকাশের আগে YouTube লিংক, ভিডিও বা অডিও ফাইল দিন।" };
  }

  const supabase = await createClient();
  const existing = d.id ? (await supabase.from("lectures").select("published_at").eq("id", d.id).maybeSingle()).data : null;
  if (d.id && !existing) return { ok: false, message: "বয়ানটি পাওয়া যায়নি।" };
  const status = STATUS[d.intent];
  const minutes = Number(d.duration_min.replace(/[০-৯]/g, (c) => String(c.charCodeAt(0) - 0x09e6)));
  const row = {
    title: d.title,
    slug: slugify(d.slug || d.title) || `lecture-${Date.now()}`,
    speaker: d.speaker || null,
    description: d.description || null,
    kind: d.kind,
    external_video_url: d.external_video_url || null,
    duration_seconds: Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes * 60) : null,
    thumbnail_media_id: d.thumbnail_media_id ?? null,
    video_media_id: d.video_media_id ?? null,
    audio_media_id: d.audio_media_id ?? null,
    status,
    published_at: status === "published" ? (existing?.published_at ?? new Date().toISOString()) : (existing?.published_at ?? null),
  } as const;

  let id = d.id;
  if (id) {
    const { error } = await supabase.from("lectures").update(row).eq("id", id);
    if (error) return dbError(error, "বয়ান");
  } else {
    const { data, error } = await supabase.from("lectures").insert(row).select("id").single();
    if (error || !data) return dbError(error, "বয়ান");
    id = data.id;
  }
  await logActivity(auth.user, { action: `lecture.${d.id ? d.intent : "create"}`, entity: "lecture", entityId: id, summary: `${d.intent === "publish" ? "প্রকাশ" : "খসড়া"}: ${d.title}` });
  for (const p of ["/admin/lectures", "/lectures", `/lectures/${row.slug}`, "/"]) revalidatePath(p);
  if (!d.id) redirect(`/admin/lectures/${id}?saved=1`);
  return { ok: true, message: d.intent === "publish" ? "বয়ান প্রকাশিত হয়েছে।" : "খসড়া সংরক্ষিত হয়েছে।" };
}

export async function deleteLecture(formData: FormData): Promise<void> {
  const auth = await actionUser("editor");
  if (!auth.user) throw new Error(auth.error);
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  const { data: old } = await supabase.from("lectures").select("title").eq("id", id).maybeSingle();
  await supabase.from("lectures").delete().eq("id", id);
  await logActivity(auth.user, { action: "lecture.delete", entity: "lecture", entityId: id, summary: `মুছে ফেলা হয়েছে: ${old?.title ?? ""}` });
  revalidatePath("/lectures");
  revalidatePath("/admin/lectures");
  redirect("/admin/lectures?deleted=1");
}

/* ───────────── Books ───────────── */

const bookSchema = z.object({
  id: optionalUuid,
  title: z.string().trim().min(2, { message: "বইয়ের নাম লিখুন।" }).max(250),
  slug: text(120),
  author_name: text(160),
  subject: text(80),
  description: text(5000),
  cover_media_id: optionalUuid,
  file_media_id: optionalUuid,
  intent,
});

export async function saveBook(_prev: FormState, formData: FormData): Promise<FormState> {
  const auth = await actionUser("editor");
  if (!auth.user) return { ok: false, message: auth.error };
  const parsed = bookSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "তথ্যগুলো ঠিকভাবে পূরণ করুন।", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const d = parsed.data;
  if (d.intent === "publish" && !d.file_media_id) return { ok: false, message: "প্রকাশের আগে বইয়ের PDF ফাইল দিন।" };

  const supabase = await createClient();
  const existing = d.id ? (await supabase.from("books").select("published_at").eq("id", d.id).maybeSingle()).data : null;
  if (d.id && !existing) return { ok: false, message: "বইটি পাওয়া যায়নি।" };
  const status = STATUS[d.intent];
  const row = {
    title: d.title,
    slug: slugify(d.slug || d.title) || `book-${Date.now()}`,
    author_name: d.author_name || null,
    subject: d.subject || null,
    description: d.description || null,
    cover_media_id: d.cover_media_id ?? null,
    file_media_id: d.file_media_id ?? null,
    status,
    published_at: status === "published" ? (existing?.published_at ?? new Date().toISOString()) : (existing?.published_at ?? null),
  } as const;

  let id = d.id;
  if (id) {
    const { error } = await supabase.from("books").update(row).eq("id", id);
    if (error) return dbError(error, "বই");
  } else {
    const { data, error } = await supabase.from("books").insert(row).select("id").single();
    if (error || !data) return dbError(error, "বই");
    id = data.id;
  }
  await logActivity(auth.user, { action: `book.${d.id ? d.intent : "create"}`, entity: "book", entityId: id, summary: `${d.intent === "publish" ? "প্রকাশ" : "খসড়া"}: ${d.title}` });
  for (const p of ["/admin/books", "/library", `/library/${row.slug}`]) revalidatePath(p);
  if (!d.id) redirect(`/admin/books/${id}?saved=1`);
  return { ok: true, message: d.intent === "publish" ? "বই প্রকাশিত হয়েছে।" : "খসড়া সংরক্ষিত হয়েছে।" };
}

export async function deleteBook(formData: FormData): Promise<void> {
  const auth = await actionUser("editor");
  if (!auth.user) throw new Error(auth.error);
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  const { data: old } = await supabase.from("books").select("title").eq("id", id).maybeSingle();
  await supabase.from("books").delete().eq("id", id);
  await logActivity(auth.user, { action: "book.delete", entity: "book", entityId: id, summary: `মুছে ফেলা হয়েছে: ${old?.title ?? ""}` });
  revalidatePath("/library");
  revalidatePath("/admin/books");
  redirect("/admin/books?deleted=1");
}
