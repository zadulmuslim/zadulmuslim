"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from "./config";
import { REMEMBER_COOKIE, rememberFrom, withRemember } from "@/lib/auth/remember";

function readCookies(): { name: string; value: string }[] {
  if (typeof document === "undefined" || !document.cookie) return [];
  return document.cookie.split(/;\s*/).map((pair) => {
    const i = pair.indexOf("=");
    const name = i < 0 ? pair : pair.slice(0, i);
    const raw = i < 0 ? "" : pair.slice(i + 1);
    let value = raw;
    try { value = decodeURIComponent(raw); } catch {}
    return { name, value };
  });
}

type CookieOpts = { path?: string; domain?: string; maxAge?: number; expires?: Date; sameSite?: boolean | "lax" | "strict" | "none"; secure?: boolean };

function writeCookie(name: string, value: string, o: CookieOpts = {}) {
  let c = `${name}=${encodeURIComponent(value)}; Path=${o.path ?? "/"}`;
  if (o.domain) c += `; Domain=${o.domain}`;
  if (o.maxAge !== undefined) c += `; Max-Age=${Math.floor(o.maxAge)}`;
  if (o.expires) c += `; Expires=${new Date(o.expires).toUTCString()}`;
  const ss = o.sameSite === true ? "Strict" : o.sameSite ? o.sameSite.charAt(0).toUpperCase() + o.sameSite.slice(1) : "Lax";
  c += `; SameSite=${ss}`;
  if (o.secure || location.protocol === "https:") c += "; Secure";
  document.cookie = c;
}

/** Browser client for Supabase Auth. Uses the public key only; honours "remember me". */
export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
    cookies: {
      getAll: () => readCookies(),
      setAll: (toSet) => {
        const remember = rememberFrom(readCookies().find((c) => c.name === REMEMBER_COOKIE)?.value);
        toSet.forEach(({ name, value, options }) => writeCookie(name, value, withRemember(options as CookieOpts, remember)));
      },
    },
  });
}
