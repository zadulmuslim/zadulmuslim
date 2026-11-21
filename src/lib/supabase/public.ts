import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

/**
 * Cookie-less client for PUBLIC reads (published Q&A, articles, categories).
 * It never reads the visitor's session, so pages using it can be statically
 * generated and cached on the CDN. RLS still applies (anon role).
 */
let client: ReturnType<typeof createClient<Database>> | null = null;

export function publicDb() {
  if (!isSupabaseConfigured()) return null;
  return (client ??= createClient<Database>(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  }));
}
