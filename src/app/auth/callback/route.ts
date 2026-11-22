import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth/redirect";
import { finishSignIn } from "@/lib/auth/finish-sign-in";

/**
 * Return point after "Continue with Google". Supabase sends ?code=… which is
 * exchanged for a session in this same browser; staff then get the emailed
 * login code like a password sign-in.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeNextPath(searchParams.get("next"), "");
  const code = searchParams.get("code");
  const go = (path: string) => NextResponse.redirect(new URL(path, origin));

  // Cancelled on Google's screen, or the provider refused.
  if (searchParams.get("error")) {
    return go(`/login?notice=${searchParams.get("error") === "access_denied" ? "google_cancelled" : "google_failed"}`);
  }
  if (!code) return go("/login?notice=google_failed");

  try {
    const supabase = await createClient({ remember: true });
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.session) return go("/login?notice=google_failed");
    const done = await finishSignIn(supabase, data.user, data.session.access_token, next);
    if (!done.ok) return go("/login?notice=google_failed");
    // First sign-in with Google (account just created): greet on the account page.
    const isNew = Date.now() - new Date(data.user.created_at).getTime() < 60_000;
    const path = isNew && !done.path.startsWith("/login/verify") ? `${done.path}${done.path.includes("?") ? "&" : "?"}welcome=1` : done.path;
    return go(path);
  } catch {
    return go("/login?notice=google_failed");
  }
}
