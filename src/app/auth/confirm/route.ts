import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth/redirect";

/**
 * Landing page for links in Supabase Auth emails (sign-up confirmation,
 * password recovery, email change, magic link, invite).
 *
 * Two link styles reach this route:
 *  1. token_hash (our branded templates) → verifyOtp. Works in ANY browser,
 *     including the Gmail app's built-in browser.
 *  2. ?code= (Supabase's default template, PKCE). Supabase has ALREADY verified
 *     the email before redirecting here; exchanging the code only fails when the
 *     link is opened in a different browser from the one used to sign up.
 *     That is not an error for the user: their email is confirmed, they just
 *     need to log in — so we say exactly that instead of showing a failure.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeNextPath(searchParams.get("next"), "/account");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const supabaseError = searchParams.get("error_code") ?? searchParams.get("error");

  const go = (path: string) => NextResponse.redirect(new URL(path, origin));

  // Supabase rejected the link before redirecting (expired, already used…).
  if (supabaseError) return go(`/login?notice=${supabaseError === "otp_expired" ? "link_expired" : "link_invalid"}`);

  try {
    const supabase = await createClient();

    if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
      if (!error) return go(type === "recovery" ? "/reset-password" : `${next}${next.includes("?") ? "&" : "?"}welcome=1`);
      // Clicking the same confirmation link twice: the email is already confirmed.
      if (type === "signup" || type === "email") return go("/login?notice=already_confirmed");
      return go(`/login?notice=${error.code === "otp_expired" ? "link_expired" : "link_invalid"}`);
    }

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return go(type === "recovery" ? "/reset-password" : `${next}${next.includes("?") ? "&" : "?"}welcome=1`);
      // Opened in another browser/app. For sign-up the email is already confirmed
      // at Supabase; a password-reset link must be opened in the original browser.
      return go(next === "/reset-password" ? "/forgot-password?notice=other_browser" : "/login?notice=confirmed_login");
    }
  } catch {
    // Misconfiguration or malformed link → generic notice below.
  }
  return go("/login?notice=link_invalid");
}
