/**
 * Public Supabase settings (safe on server and client).
 * Accepts either the legacy anon key or the newer publishable key
 * (sb_publishable_…). Each variable is referenced literally so Next.js can
 * inline it into the browser bundle.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLIC_KEY);
}
