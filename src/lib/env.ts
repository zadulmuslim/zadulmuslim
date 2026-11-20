import "server-only";
import { z } from "zod";

/**
 * Server-only environment. Parsed lazily so `next build` works without
 * secrets; the first request that needs a value fails loudly if it is missing.
 * Nothing in this file may ever be imported by a client component.
 */
const serverSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_PUBLIC_URL: z
    .url()
    .transform((v) => v.replace(/\/+$/, "")),
  /** Optional: a second bucket with NO public domain for private files (recommended). */
  R2_PRIVATE_BUCKET_NAME: z.string().min(1).optional(),

  /** Optional: protects the scheduled cleanup endpoint. */
  CRON_SECRET: z.string().min(16).optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverSchema.safeParse({
    ...process.env,
    R2_PRIVATE_BUCKET_NAME: process.env.R2_PRIVATE_BUCKET_NAME || undefined,
    CRON_SECRET: process.env.CRON_SECRET || undefined,
  });
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Invalid or missing server environment variables: ${missing}`);
  }
  cached = parsed.data;
  return cached;
}

/** Public values that are safe in the browser bundle. */
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
};
