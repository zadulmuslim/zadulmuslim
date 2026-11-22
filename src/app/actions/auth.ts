"use server";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { createClient as createPlainClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from "@/lib/supabase/config";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { safeNextPath } from "@/lib/auth/redirect";
import type { FormState } from "@/components/ui/form-message";
import { verifyCaptcha } from "@/lib/captcha";
import { REMEMBER_COOKIE, REMEMBER_MAX_AGE } from "@/lib/auth/remember";
import { getSessionUser } from "@/lib/auth/session";
import { checkLoginCode, markSessionVerified, sendLoginCode, staffOtpEnabled } from "@/lib/auth/otp";
import { logActivity } from "@/lib/audit";
import { finishSignIn, googleAuthEnabled } from "@/lib/auth/finish-sign-in";

/** Starts "Continue with Google": sends the browser to Google via Supabase. */
export async function signInWithGoogle(formData: FormData): Promise<void> {
  if (!isSupabaseConfigured() || !googleAuthEnabled()) redirect("/login?notice=google_unavailable");
  const next = safeNextPath(formData.get("next"), "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  const callback = new URL(`${proto}://${host}/auth/callback`);
  if (next) callback.searchParams.set("next", next);

  // Google sign-ins stay signed in like "remember me".
  (await cookies()).set(REMEMBER_COOKIE, "1", { path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: REMEMBER_MAX_AGE });
  const supabase = await createClient({ remember: true });
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callback.toString(), queryParams: { prompt: "select_account" } },
  });
  if (error || !data.url) redirect("/login?notice=google_failed");
  redirect(data.url);
}

const NOT_CONFIGURED: FormState = { ok: false, message: "লগইন সেবা সাময়িকভাবে বন্ধ আছে। কিছুক্ষণ পর আবার চেষ্টা করুন।" };

const email = z.email({ message: "সঠিক ইমেইল ঠিকানা লিখুন।" }).trim().toLowerCase();
const password = z.string().min(8, { message: "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।" }).max(72);

async function siteOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
}

/** Map Supabase Auth errors to Bengali messages without leaking details. */
function authError(code: string | undefined, fallback: string): string {
  switch (code) {
    case "invalid_credentials": return "ইমেইল বা পাসওয়ার্ড সঠিক নয়।";
    case "email_not_confirmed": return "আপনার ইমেইল এখনো যাচাই করা হয়নি। ইনবক্সে পাঠানো লিংকে ক্লিক করুন।";
    case "user_already_exists":
    case "email_exists": return "এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট খোলা হয়েছে।";
    case "weak_password": return "পাসওয়ার্ডটি দুর্বল। অক্ষর, সংখ্যা ও চিহ্ন মিলিয়ে আরও শক্ত পাসওয়ার্ড দিন।";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit": return "অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।";
    case "same_password": return "নতুন পাসওয়ার্ড আগেরটির থেকে আলাদা হতে হবে।";
    default: return fallback;
  }
}

const captchaFail = (message: string): FormState => ({ ok: false, message, fieldErrors: { captcha_answer: [message] } });

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const parsed = z.object({ email, password: z.string().min(1, { message: "পাসওয়ার্ড লিখুন।" }) }).safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, message: "তথ্যগুলো ঠিকভাবে পূরণ করুন।", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const captcha = await verifyCaptcha(formData);
  if (!captcha.ok) return captchaFail(captcha.message);

  const remember = formData.get("remember") === "on";
  const cookieStore = await cookies();
  cookieStore.set(REMEMBER_COOKIE, remember ? "1" : "0", {
    path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production",
    ...(remember ? { maxAge: REMEMBER_MAX_AGE } : {}),
  });

  const supabase = await createClient({ remember });
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return { ok: false, message: authError(error?.code, "লগইন করা যায়নি। আবার চেষ্টা করুন।") };

  const next = safeNextPath(formData.get("next"), "");
  const done = await finishSignIn(supabase, data.user, data.session.access_token, next);
  if (!done.ok) return { ok: false, message: done.message };
  redirect(done.path);
}

const otpSchema = z.string().trim().min(1, { message: "ইমেইলে পাওয়া ৬ সংখ্যার কোডটি লিখুন।" });

/** Second step for staff: checks the emailed code. */
export async function verifyLoginCode(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const next = safeNextPath(formData.get("next"), "/admin");
  if (!user.needsOtp) redirect(next);
  const parsed = otpSchema.safeParse(formData.get("code"));
  if (!parsed.success || !user.sessionId) return { ok: false, message: "ইমেইলে পাওয়া ৬ সংখ্যার কোডটি লিখুন।" };

  const result = await checkLoginCode(user.sessionId, user.id, parsed.data);
  if (result === "ok") {
    await logActivity({ ...user, role: user.actualRole }, { action: "auth.login", entity: "user", entityId: user.id, summary: "দুই-ধাপ যাচাই করে লগইন" });
    // A full page load (done by the form) guarantees every part of the site
    // sees the newly verified session; a client-side redirect could reuse stale state.
    return { ok: true, message: "যাচাই সম্পন্ন হয়েছে। প্রবেশ করানো হচ্ছে…", redirectTo: next };
  }
  if (result === "locked") {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: "local" });
    return { ok: false, message: "অনেকবার ভুল কোড দেওয়া হয়েছে, তাই নিরাপত্তার জন্য লগআউট করা হয়েছে।", redirectTo: "/login?notice=otp_locked" };
  }
  if (result === "expired") return { ok: false, message: "কোডের মেয়াদ শেষ বা কোড পাঠানো হয়নি। 'আবার কোড পাঠান' চাপুন।" };
  return { ok: false, message: "কোডটি সঠিক নয়। ইমেইলের সর্বশেষ কোডটি দেখে আবার লিখুন।" };
}

export async function resendLoginCode(_prev: FormState, _formData: FormData): Promise<FormState> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.needsOtp || !user.sessionId || !user.email) return { ok: false, message: "এই সেশনের জন্য কোডের প্রয়োজন নেই।" };
  if (!staffOtpEnabled()) {
    await markSessionVerified(user.sessionId, user.id);
    redirect("/admin");
  }
  const sent = await sendLoginCode({ sessionId: user.sessionId, userId: user.id, email: user.email, name: user.displayName });
  return sent.ok ? { ok: true, message: "নতুন কোড আপনার ইমেইলে পাঠানো হয়েছে।" } : { ok: false, message: sent.message };
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const parsed = z
    .object({
      name: z.string().trim().min(2, { message: "আপনার নাম লিখুন।" }).max(80),
      email,
      password,
      confirm: z.string(),
    })
    .refine((d) => d.password === d.confirm, { message: "দুটি পাসওয়ার্ড মিলছে না।", path: ["confirm"] })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "তথ্যগুলো ঠিকভাবে পূরণ করুন।", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const captcha = await verifyCaptcha(formData);
  if (!captcha.ok) return captchaFail(captcha.message);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.name },
      emailRedirectTo: `${await siteOrigin()}/auth/confirm?next=/account`,
    },
  });
  if (error) return { ok: false, message: authError(error.code, "অ্যাকাউন্ট খোলা যায়নি। আবার চেষ্টা করুন।") };
  // Email confirmation disabled in Supabase → a session is returned immediately.
  if (data.session) redirect("/account");
  return { ok: true, message: "প্রায় হয়ে গেছে! আপনার ইমেইলে একটি যাচাই লিংক পাঠানো হয়েছে। লিংকে ক্লিক করে অ্যাকাউন্ট চালু করুন।" };
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const parsed = email.safeParse(formData.get("email"));
  if (!parsed.success) return { ok: false, message: "সঠিক ইমেইল ঠিকানা লিখুন।" };
  const captcha = await verifyCaptcha(formData);
  if (!captcha.ok) return captchaFail(captcha.message);
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${await siteOrigin()}/auth/confirm?next=/reset-password`,
  });
  if (error?.code?.startsWith("over_")) return { ok: false, message: authError(error.code, "") };
  // Same answer whether or not the account exists (prevents email enumeration).
  return { ok: true, message: "এই ইমেইলে অ্যাকাউন্ট থাকলে পাসওয়ার্ড পরিবর্তনের লিংক পাঠানো হয়েছে।" };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const parsed = z
    .object({ password, confirm: z.string() })
    .refine((d) => d.password === d.confirm, { message: "দুটি পাসওয়ার্ড মিলছে না।", path: ["confirm"] })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "তথ্যগুলো ঠিকভাবে পূরণ করুন।", fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, message: "লিংকের মেয়াদ শেষ হয়ে গেছে। আবার পাসওয়ার্ড রিসেটের অনুরোধ করুন।" };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, message: authError(error.code, "পাসওয়ার্ড পরিবর্তন করা যায়নি।") };
  redirect("/account?password=updated");
}

/** Logged-in password change: confirms the current password first. */
export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const user = await getSessionUser();
  if (!user?.email) redirect("/login?next=/account/password");
  const parsed = z
    .object({ current: z.string().min(1, { message: "বর্তমান পাসওয়ার্ড লিখুন।" }), password, confirm: z.string() })
    .refine((d) => d.password === d.confirm, { message: "দুটি পাসওয়ার্ড মিলছে না।", path: ["confirm"] })
    .refine((d) => d.password !== d.current, { message: "নতুন পাসওয়ার্ড বর্তমানটির থেকে আলাদা হতে হবে।", path: ["password"] })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "তথ্যগুলো ঠিকভাবে পূরণ করুন।", fieldErrors: z.flattenError(parsed.error).fieldErrors };

  // Check the current password with a throw-away client, then end that check session.
  const probe = createPlainClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: wrong } = await probe.auth.signInWithPassword({ email: user.email, password: parsed.data.current });
  if (wrong) return { ok: false, message: "বর্তমান পাসওয়ার্ড সঠিক নয়।", fieldErrors: { current: ["বর্তমান পাসওয়ার্ড সঠিক নয়।"] } };
  await probe.auth.signOut({ scope: "local" });

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, message: authError(error.code, "পাসওয়ার্ড পরিবর্তন করা যায়নি।") };
  redirect("/account?password=updated");
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
