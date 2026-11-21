import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";
import { REMEMBER_COOKIE, rememberFrom, withRemember } from "@/lib/auth/remember";
import type { Database } from "./database.types";

/**
 * Supabase client bound to the signed-in user's session (RLS applies).
 * `remember` overrides the "remember me" cookie (used by the login action).
 */
export async function createClient(opts: { remember?: boolean } = {}) {
  const cookieStore = await cookies();
  const remember = opts.remember ?? rememberFrom(cookieStore.get(REMEMBER_COOKIE)?.value);
  return createServerClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, withRemember(options, remember)));
        } catch {
          // Called from a Server Component: cookies are read-only there.
          // The proxy refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}
