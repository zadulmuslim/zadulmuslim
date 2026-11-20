import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/storage/categories";

export interface SessionUser {
  id: string;
  email: string | null;
  role: UserRole;
}

/** Current user (verified with Supabase Auth) and their role from public.profiles. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle<{ role: UserRole }>();

  return { id: data.user.id, email: data.user.email ?? null, role: profile?.role ?? "member" };
});
