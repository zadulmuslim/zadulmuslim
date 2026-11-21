import "server-only";
import { publicDb } from "@/lib/supabase/public";
import { mediaRefs, type MediaRef } from "@/lib/media-lookup";
import { youtubeId, youtubeThumb } from "@/lib/youtube";

export type LectureKind = "video" | "audio" | "nasheed";
export const KIND_LABEL: Record<LectureKind, string> = { video: "ভিডিও বয়ান", audio: "অডিও বয়ান", nasheed: "হামদ ও নাত" };

export interface LectureCard { id: string; slug: string; title: string; speaker: string | null; kind: LectureKind; duration_seconds: number | null; thumb: string | null; published_at: string | null }

export async function listLectures(kind?: LectureKind, limit = 60): Promise<LectureCard[]> {
  const db = publicDb();
  if (!db) return [];
  let q = db.from("lectures").select("id, slug, title, speaker, kind, duration_seconds, external_video_url, thumbnail_media_id, published_at").eq("status", "published").order("published_at", { ascending: false }).limit(limit);
  if (kind) q = q.eq("kind", kind);
  const { data } = await q;
  const rows = data ?? [];
  const m = await mediaRefs(db, rows.map((r) => r.thumbnail_media_id));
  return rows.map((r) => {
    const yt = youtubeId(r.external_video_url);
    return { ...r, thumb: (r.thumbnail_media_id && m[r.thumbnail_media_id]?.url) || (yt ? youtubeThumb(yt) : null) };
  });
}

export async function getLecture(slug: string) {
  const db = publicDb();
  if (!db) return null;
  const { data: l } = await db.from("lectures").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  if (!l) return null;
  const m = await mediaRefs(db, [l.thumbnail_media_id, l.video_media_id, l.audio_media_id]);
  const get = (id: string | null): MediaRef | null => (id && m[id]) || null;
  return { ...l, youtube: youtubeId(l.external_video_url), thumb: get(l.thumbnail_media_id), video: get(l.video_media_id), audio: get(l.audio_media_id) };
}

export interface BookCard { id: string; slug: string; title: string; author_name: string | null; subject: string | null; cover: string | null }

export async function listBooks(subject?: string): Promise<BookCard[]> {
  const db = publicDb();
  if (!db) return [];
  let q = db.from("books").select("id, slug, title, author_name, subject, cover_media_id").eq("status", "published").order("published_at", { ascending: false }).limit(300);
  if (subject) q = q.eq("subject", subject);
  const { data } = await q;
  const rows = data ?? [];
  const m = await mediaRefs(db, rows.map((r) => r.cover_media_id));
  return rows.map((r) => ({ ...r, cover: (r.cover_media_id && m[r.cover_media_id]?.url) || null }));
}

export async function bookSubjects(): Promise<string[]> {
  const db = publicDb();
  if (!db) return [];
  const { data } = await db.from("books").select("subject").eq("status", "published").not("subject", "is", null).limit(1000);
  return [...new Set((data ?? []).map((b) => b.subject!))].sort();
}

export async function getBook(slug: string) {
  const db = publicDb();
  if (!db) return null;
  const { data: b } = await db.from("books").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  if (!b) return null;
  const m = await mediaRefs(db, [b.cover_media_id, b.file_media_id]);
  return { ...b, cover: (b.cover_media_id && m[b.cover_media_id]) || null, file: (b.file_media_id && m[b.file_media_id]) || null };
}

export const minutesLabel = (s: number | null) => (s ? `${Math.round(s / 60)}` : null);
