import "server-only";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SessionUser } from "@/lib/auth/session";
import { roleAtLeast } from "@/lib/storage/categories";

export const TARGETS = ["question", "article", "hadith", "lecture"] as const;
export type TargetType = (typeof TARGETS)[number];
export const REACTIONS = ["like", "love", "care", "wow", "sad", "dua"] as const;
export type Reaction = (typeof REACTIONS)[number];

export interface CommentDTO {
  id: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  editedAt: string | null;
  hidden: boolean;
  author: { id: string; name: string; avatar: string | null; badge: string | null };
  reactions: { total: number; top: Reaction[]; counts: Partial<Record<Reaction, number>> };
  myReaction: Reaction | null;
  mine: boolean;
}

export interface ThreadDTO {
  comments: CommentDTO[];
  total: number;
  viewer: { id: string; canModerate: boolean } | null;
}

const BADGE: Record<string, string> = { editor: "সম্পাদক", admin: "অ্যাডমিন", super_admin: "অ্যাডমিন" };
const MAX_LOAD = 1000;

/** The target must exist and be publicly visible. */
export async function targetExists(type: TargetType, id: string): Promise<boolean> {
  const db = createAdminClient();
  switch (type) {
    case "question": {
      if (!z.uuid().safeParse(id).success) return false;
      const { data } = await db.from("questions").select("id").eq("id", id).eq("status", "answered").eq("is_public", true).maybeSingle();
      return Boolean(data);
    }
    case "article": {
      if (!z.uuid().safeParse(id).success) return false;
      const { data } = await db.from("articles").select("id").eq("id", id).eq("status", "published").maybeSingle();
      return Boolean(data);
    }
    case "lecture": {
      if (!z.uuid().safeParse(id).success) return false;
      const { data } = await db.from("lectures").select("id").eq("id", id).eq("status", "published").maybeSingle();
      return Boolean(data);
    }
    case "hadith": {
      if (!/^\d{1,7}$/.test(id)) return false;
      const { data } = await db.from("hadiths").select("id").eq("id", Number(id)).maybeSingle();
      return Boolean(data);
    }
  }
}

/** Whole thread (top-level comments and replies) with reactions, for one post. */
export async function loadThread(type: TargetType, id: string, viewer: SessionUser | null): Promise<ThreadDTO> {
  const db = createAdminClient();
  const canModerate = Boolean(viewer && roleAtLeast(viewer.role, "editor"));
  let q = db.from("comments").select("id, parent_id, author_id, body, status, edited_at, created_at").eq("target_type", type).eq("target_id", id).order("created_at", { ascending: true }).limit(MAX_LOAD);
  if (!canModerate) q = q.eq("status", "visible");
  const { data: rows } = await q;
  const list = rows ?? [];
  if (!list.length) return { comments: [], total: 0, viewer: viewer ? { id: viewer.id, canModerate } : null };

  const ids = list.map((c) => c.id);
  const authorIds = [...new Set(list.map((c) => c.author_id))];
  const [{ data: reacts }, { data: profiles }] = await Promise.all([
    db.from("comment_reactions").select("comment_id, user_id, kind").in("comment_id", ids),
    db.from("profiles").select("id, display_name, role, avatar_media_id").in("id", authorIds),
  ]);
  const avatarIds = (profiles ?? []).map((p) => p.avatar_media_id).filter((x): x is string => Boolean(x));
  const { data: media } = avatarIds.length ? await db.from("media").select("id, public_url").in("id", avatarIds) : { data: [] };
  const avatarOf = new Map((media ?? []).map((m) => [m.id, m.public_url]));
  const prof = new Map((profiles ?? []).map((p) => [p.id, p]));

  const byComment = new Map<string, { kind: Reaction; user_id: string }[]>();
  for (const r of reacts ?? []) {
    const arr = byComment.get(r.comment_id) ?? [];
    arr.push({ kind: r.kind as Reaction, user_id: r.user_id });
    byComment.set(r.comment_id, arr);
  }

  const comments: CommentDTO[] = list.map((c) => {
    const p = prof.get(c.author_id);
    const rs = byComment.get(c.id) ?? [];
    const counts: Partial<Record<Reaction, number>> = {};
    for (const r of rs) counts[r.kind] = (counts[r.kind] ?? 0) + 1;
    const top = (Object.entries(counts) as [Reaction, number][]).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
    return {
      id: c.id,
      parentId: c.parent_id,
      body: c.body,
      createdAt: c.created_at,
      editedAt: c.edited_at,
      hidden: c.status === "hidden",
      author: {
        id: c.author_id,
        name: p?.display_name?.trim() || "পাঠক",
        avatar: (p?.avatar_media_id && avatarOf.get(p.avatar_media_id)) || null,
        badge: p ? (BADGE[p.role] ?? null) : null,
      },
      reactions: { total: rs.length, top, counts },
      myReaction: (viewer && rs.find((r) => r.user_id === viewer.id)?.kind) || null,
      mine: viewer?.id === c.author_id,
    };
  });
  return { comments, total: comments.length, viewer: viewer ? { id: viewer.id, canModerate } : null };
}

/** Collapses runs of blank lines and trims. */
export function cleanBody(s: string): string {
  return s.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
