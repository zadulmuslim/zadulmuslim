import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from "./config";
import { REMEMBER_COOKIE, rememberFrom, withRemember } from "@/lib/auth/remember";

/** Refreshes the Supabase Auth session cookie on every matched request. */
export async function updateSession(request: NextRequest) {
  const url = SUPABASE_URL;
  const key = SUPABASE_PUBLIC_KEY;
  let response = NextResponse.next({ request });
  if (!url || !key) return response; // not configured yet (e.g. first local run)

  const remember = rememberFrom(request.cookies.get(REMEMBER_COOKIE)?.value);
  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet, headers) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, withRemember(options, remember)));
        Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // Do not run code between createServerClient and getClaims().
  await supabase.auth.getClaims();
  return response;
}
