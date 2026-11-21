import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SessionUser } from "@/lib/auth/session";

export type AuditEntity = "question" | "article" | "media" | "user" | "category" | "lecture" | "book";

/**
 * Append to the activity log (admin-visible). Written with the actor's own
 * session, so RLS guarantees actor_id is really the signed-in user.
 * Never throws: logging must not break the action being logged.
 */
export async function logActivity(
  user: SessionUser,
  entry: { action: string; entity: AuditEntity; entityId?: string | null; summary?: string; metadata?: Record<string, unknown> },
): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("audit_log").insert({
      actor_id: user.id,
      actor_name: user.displayName ?? user.email,
      action: entry.action,
      entity_type: entry.entity,
      entity_id: entry.entityId ?? null,
      summary: entry.summary?.slice(0, 300) ?? null,
      metadata: (entry.metadata ?? {}) as never,
    });
  } catch (err) {
    console.error("[audit]", err);
  }
}
