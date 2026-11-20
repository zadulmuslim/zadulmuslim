import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";
import type { Database } from "./database.types";

/**
 * Service-role client: bypasses RLS. Use ONLY in server code, and only after
 * the caller's identity and permissions have been checked.
 */
let admin: SupabaseClient<Database> | null = null;

export function createAdminClient() {
  if (admin) return admin;
  const env = serverEnv();
  admin = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}
