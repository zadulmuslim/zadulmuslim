import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { roleAtLeast, type UserRole } from "@/lib/storage/categories";

export interface SessionUser {
  id: string;
  email: string | null;
  /** Effective role: staff roles apply only after the emailed login code is verified. */
  role: UserRole;
  /** Role stored in the profile, regardless of verification. */
  actualRole: UserRole;
  /** Staff member whose session still needs the emailed login code. */
  needsOtp: boolean;
  sessionId: string | null;
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

  const actualRole: UserRole = profile?.role ?? "member";
  let verified = true;
  if (roleAtLeast(actualRole, "editor")) {
    const { data: ok } = await supabase.rpc("session_verified");
    verified = ok === true;
  }

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
    role: verified ? actualRole : "member",
    actualRole,
    needsOtp: !verified,
    sessionId: typeof claims.session_id === "string" ? claims.session_id : null,
    displayName: profile?.display_name ?? null,
  };
});
