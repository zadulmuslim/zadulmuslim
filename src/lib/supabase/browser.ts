"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from "./config";

/** Browser client for Supabase Auth (sign-in, sign-out). Uses the public anon key only. */
export function createClient() {
  return createBrowserClient<Database>(
    SUPABASE_URL,
    SUPABASE_PUBLIC_KEY,
  );
}
