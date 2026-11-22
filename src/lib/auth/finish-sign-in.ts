import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { roleAtLeast } from "@/lib/storage/categories";
import { hasSupabaseAdmin } from "@/lib/env";
import { markSessionVerified, sendLoginCode, sessionIdFromAccessToken, staffOtpEnabled } from "@/lib/auth/otp";

/**
 * After any successful sign-in (password or Google): staff accounts must also
 * pass the emailed login code. Returns where to send the browser next.
 */
export async function finishSignIn(
  supabase: SupabaseClient<Database>,
  user: User,
  accessToken: string,
  next: string,
): Promise<{ ok: true; path: string } | { ok: false; message: string }> {
  const { data: profile } = await supabase.from("profiles").select("role, display_name").eq("id", user.id).maybeSingle();
  if (profile && roleAtLeast(profile.role, "editor") && hasSupabaseAdmin()) {
    const sessionId = sessionIdFromAccessToken(accessToken);
    if (!sessionId) return { ok: false, message: "লগইন সেশন তৈরি করা যায়নি। আবার চেষ্টা করুন।" };
    if (staffOtpEnabled() && user.email) {
      const sent = await sendLoginCode({ sessionId, userId: user.id, email: user.email, name: profile.display_name });
      const q = new URLSearchParams({ ...(next ? { next } : {}), ...(sent.ok ? { sent: "1" } : {}) });
      return { ok: true, path: `/login/verify?${q}` };
    }
    // Email not configured yet: two-step login cannot run, so the session is trusted.
    console.warn("[auth] staff OTP skipped: RESEND_API_KEY not configured");
    await markSessionVerified(sessionId, user.id);
  }
  return { ok: true, path: next || "/account" };
}

/** Google sign-in is shown once the provider is set up in Supabase (GOOGLE_AUTH_ENABLED=true). */
export function googleAuthEnabled(): boolean {
  return process.env.GOOGLE_AUTH_ENABLED === "true";
}
