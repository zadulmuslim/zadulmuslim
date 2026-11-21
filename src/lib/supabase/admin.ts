import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdminEnv } from "@/lib/env";
import type { Database } from "./database.types";

/**
 * Service-role client: bypasses RLS. Use ONLY in server code, and only after
 * the caller's identity and permissions have been checked.
 */
let admin: SupabaseClient<Database> | null = null;

export function createAdminClient() {
  if (admin) return admin;
  const env = supabaseAdminEnv();
  admin = createClient<Database>(env.url, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}
