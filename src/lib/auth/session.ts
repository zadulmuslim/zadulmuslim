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
  // getClaims() verifies the JWT locally when the project uses asymmetric
  // signing keys (no network call); otherwise it falls back to the Auth server.
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", claims.sub)
    .maybeSingle();

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
    role: profile?.role ?? "member",
    displayName: profile?.display_name ?? null,
  };
});
