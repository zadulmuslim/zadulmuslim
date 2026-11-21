import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { UserRole } from "@/lib/storage/categories";

export interface SessionUser {
  id: string;
  email: string | null;
  role: UserRole;
  displayName: string | null;
}

/** Current user (verified with Supabase Auth) and their role from public.profiles. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  await connection(); // always per-request: never prerender a page that depends on the session
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", data.user.id)
    .maybeSingle();

  return {
    id: data.user.id,
    email: data.user.email ?? null,
    role: profile?.role ?? "member",
    displayName: profile?.display_name ?? null,
  };
});
