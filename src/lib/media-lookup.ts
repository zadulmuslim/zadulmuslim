import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export interface MediaRef { id: string; url: string; name: string; mime: string }

/** Public URL + file name for a set of media ids (nulls ignored). */
export async function mediaRefs(db: SupabaseClient<Database>, ids: (string | null | undefined)[]): Promise<Record<string, MediaRef>> {
  const list = [...new Set(ids.filter((x): x is string => Boolean(x)))];
  if (!list.length) return {};
  const { data } = await db.from("media").select("id, public_url, original_filename, mime_type").in("id", list);
  return Object.fromEntries((data ?? []).filter((m) => m.public_url).map((m) => [m.id, { id: m.id, url: m.public_url!, name: m.original_filename, mime: m.mime_type }]));
}
