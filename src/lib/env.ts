import "server-only";
import { z } from "zod";
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from "@/lib/supabase/config";

/**
 * Server-only environment, validated lazily and in independent groups so a
 * missing R2 value never breaks Supabase features (and vice versa).
 * Nothing in this file may ever be imported by a client component.
 */

/** Thrown when a feature's configuration is missing; mapped to HTTP 503. */
export class ConfigError extends Error {
  constructor(
    public readonly feature: "supabase-admin" | "r2",
    public readonly missing: string[],
  ) {
    super(`Missing configuration for ${feature}: ${missing.join(", ")}`);
    this.name = "ConfigError";
  }
}

function parseGroup<T extends z.ZodType>(feature: ConfigError["feature"], schema: T, input: Record<string, unknown>): z.infer<T> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new ConfigError(feature, parsed.error.issues.map((i) => i.path.join(".")));
  return parsed.data;
}

const blank = (v: string | undefined) => (v ? v : undefined);

// ── Supabase service role (bypasses RLS; server-only) ──
const supabaseAdminSchema = z.object({
  url: z.url(),
  /** Service-role key (legacy JWT) or new secret key (sb_secret_…). */
  serviceRoleKey: z.string().min(1),
});
let supabaseAdminCache: z.infer<typeof supabaseAdminSchema> | null = null;

export function supabaseAdminEnv() {
  return (supabaseAdminCache ??= parseGroup("supabase-admin", supabaseAdminSchema, {
    url: blank(SUPABASE_URL),
    // Either name works: Supabase now calls it the "secret key".
    serviceRoleKey: blank(process.env.SUPABASE_SERVICE_ROLE_KEY) ?? blank(process.env.SUPABASE_SECRET_KEY),
  }));
}

/** True when the service-role key is available (lets pages degrade gracefully). */
export function hasSupabaseAdmin(): boolean {
  try {
    supabaseAdminEnv();
    return true;
  } catch {
    return false;
  }
}

// ── Cloudflare R2 ──
const r2Schema = z.object({
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_PUBLIC_URL: z.url().transform((v) => v.replace(/\/+$/, "")),
  /** Optional: a second bucket with NO public domain for private files (recommended). */
  R2_PRIVATE_BUCKET_NAME: z.string().min(1).optional(),
});
let r2Cache: z.infer<typeof r2Schema> | null = null;

export function r2Env() {
  return (r2Cache ??= parseGroup("r2", r2Schema, {
    R2_ACCOUNT_ID: blank(process.env.R2_ACCOUNT_ID),
    R2_ACCESS_KEY_ID: blank(process.env.R2_ACCESS_KEY_ID),
    R2_SECRET_ACCESS_KEY: blank(process.env.R2_SECRET_ACCESS_KEY),
    R2_BUCKET_NAME: blank(process.env.R2_BUCKET_NAME),
    R2_PUBLIC_URL: blank(process.env.R2_PUBLIC_URL),
    R2_PRIVATE_BUCKET_NAME: blank(process.env.R2_PRIVATE_BUCKET_NAME),
  }));
}

/** Optional secret for the scheduled cleanup endpoint (null if unset). */
export function cronSecret(): string | null {
  const v = process.env.CRON_SECRET;
  return v && v.length >= 16 ? v : null;
}

/** Public values that are safe in the browser bundle. */
export const publicEnv = {
  supabaseUrl: SUPABASE_URL,
  supabaseAnonKey: SUPABASE_PUBLIC_KEY,
};
