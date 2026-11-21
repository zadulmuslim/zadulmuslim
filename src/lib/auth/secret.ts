import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Server-side signing key for captchas and login codes.
 * Uses AUTH_SECRET when set, otherwise derives from the Supabase secret key,
 * so no extra configuration is required. Each purpose gets its own sub-key.
 */
function rootSecret(): string | null {
  return process.env.AUTH_SECRET || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || null;
}

export function hasSigningSecret(): boolean {
  return rootSecret() !== null;
}

export function sign(purpose: string, data: string): string {
  const root = rootSecret();
  if (!root) throw new Error("No signing secret configured");
  const key = createHmac("sha256", root).update(`zadulmuslim:${purpose}`).digest();
  return createHmac("sha256", key).update(data).digest("base64url");
}

export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Converts Bengali digits (০-৯) to ASCII and strips spaces. */
export function normalizeDigits(s: string): string {
  return s.replace(/[০-৯]/g, (d) => String(d.charCodeAt(0) - 0x09e6)).replace(/\s+/g, "");
}
