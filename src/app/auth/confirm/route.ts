import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth/redirect";

/**
 * Landing page for links in Supabase Auth emails (sign-up confirmation,
 * password recovery, email change). Supports both the token-hash template
 * (recommended) and the default PKCE `?code=` redirect.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeNextPath(searchParams.get("next"), "/account");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  let ok = false;
  try {
    const supabase = await createClient();
    if (tokenHash && type) {
      ok = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;
    } else if (code) {
      ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
    }
  } catch {
    ok = false; // misconfigured or malformed link → friendly error below
  }

  const destination = ok ? (type === "recovery" ? "/reset-password" : next) : "/login?error=link";
  return NextResponse.redirect(new URL(destination, origin));
}
