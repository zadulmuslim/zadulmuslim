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

type Row = { id: string; parent_id: string | null; author_id: string; body: string; status: string; edited_at: string | null; created_at: string };
const COLS = "id, parent_id, author_id, body, status, edited_at, created_at";

/** Display name, avatar and staff badge for a set of authors. */
async function authorsOf(ids: string[]) {
  const db = createAdminClient();
  const { data: profiles } = ids.length ? await db.from("profiles").select("id, display_name, role, avatar_media_id").in("id", ids) : { data: [] };
  const avatarIds = (profiles ?? []).map((p) => p.avatar_media_id).filter((x): x is string => Boolean(x));
  const { data: media } = avatarIds.length ? await db.from("media").select("id, public_url").in("id", avatarIds) : { data: [] };
  const avatarOf = new Map((media ?? []).map((m) => [m.id, m.public_url]));
  return new Map(
    (profiles ?? []).map((p) => [
      p.id,
      { id: p.id, name: p.display_name?.trim() || "পাঠক", avatar: (p.avatar_media_id && avatarOf.get(p.avatar_media_id)) || null, badge: BADGE[p.role] ?? null },
    ]),
  );
}

function toDTO(c: Row, authors: Awaited<ReturnType<typeof authorsOf>>, viewerId: string | null): CommentDTO {
  return {
    id: c.id,
    parentId: c.parent_id,
    body: c.body,
    createdAt: c.created_at,
    editedAt: c.edited_at,
    hidden: c.status === "hidden",
    author: authors.get(c.author_id) ?? { id: c.author_id, name: "পাঠক", avatar: null, badge: null },
    mine: viewerId === c.author_id,
  };
}

/** Whole thread (top-level comments and replies) for one post. */
export async function loadThread(type: TargetType, id: string, viewer: SessionUser | null): Promise<ThreadDTO> {
  const db = createAdminClient();
  const canModerate = Boolean(viewer && roleAtLeast(viewer.role, "editor"));
  let q = db.from("comments").select(COLS).eq("target_type", type).eq("target_id", id).order("created_at", { ascending: true }).limit(MAX_LOAD);
  if (!canModerate) q = q.eq("status", "visible");
  const { data: rows } = await q;
  const list = (rows ?? []) as Row[];
  const authors = await authorsOf([...new Set(list.map((c) => c.author_id))]);
  return {
    comments: list.map((c) => toDTO(c, authors, viewer?.id ?? null)),
    total: list.length,
    viewer: viewer ? { id: viewer.id, canModerate } : null,
  };
}

/** One comment as the client shows it (used right after posting). */
export async function commentDTO(row: Row, viewerId: string): Promise<CommentDTO> {
  return toDTO(row, await authorsOf([row.author_id]), viewerId);
}
export { COLS as COMMENT_COLS };

/** Reaction counts for a post, and the viewer's own reaction. */
export async function postReactions(type: TargetType, id: string, viewerId: string | null) {
  const db = createAdminClient();
  const { data } = await db.from("post_reactions").select("user_id, kind").eq("target_type", type).eq("target_id", id).limit(20000);
  const counts: Partial<Record<Reaction, number>> = {};
  let mine: Reaction | null = null;
  for (const r of data ?? []) {
    counts[r.kind as Reaction] = (counts[r.kind as Reaction] ?? 0) + 1;
    if (viewerId && r.user_id === viewerId) mine = r.kind as Reaction;
  }
  return { counts, mine, signedIn: Boolean(viewerId) };
}

/** Collapses runs of blank lines and trims. */
export function cleanBody(s: string): string {
  return s.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
