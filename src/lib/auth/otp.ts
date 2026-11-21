import "server-only";
import { randomInt } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { brandedEmail, emailConfigured, sendEmail } from "@/lib/email";
import { normalizeDigits, safeEqual, sign } from "./secret";

/**
 * Two-step login for staff (editor, admin, super_admin): after the password,
 * a 6-digit code is emailed. The code is tied to the Supabase session; only
 * after it is entered does the database (app_role) grant staff powers.
 */

export const OTP_TTL_MIN = 10;
const RESEND_COOLDOWN_S = 60;
const MAX_SENDS = 5;
const MAX_ATTEMPTS = 5;

const hash = (sessionId: string, code: string) => sign("login-otp", `${sessionId}:${code}`);

/** session_id claim from a Supabase access token. */
export function sessionIdFromAccessToken(token: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8"));
    return typeof payload.session_id === "string" ? payload.session_id : null;
  } catch {
    return null;
  }
}

/** Two-step login is on whenever email can be sent. */
export const staffOtpEnabled = () => emailConfigured();

export async function markSessionVerified(sessionId: string, userId: string): Promise<boolean> {
  const db = createAdminClient();
  const { error } = await db.from("staff_sessions").upsert({ session_id: sessionId, user_id: userId });
  await db.from("login_otps").delete().eq("session_id", sessionId);
  if (error) console.error("[otp] verify session", error.message);
  return !error;
}

export async function pendingCode(sessionId: string): Promise<{ active: boolean; waitSeconds: number }> {
  const { data } = await createAdminClient().from("login_otps").select("expires_at, last_sent_at").eq("session_id", sessionId).maybeSingle();
  if (!data || new Date(data.expires_at).getTime() < Date.now()) return { active: false, waitSeconds: 0 };
  const wait = RESEND_COOLDOWN_S - Math.floor((Date.now() - new Date(data.last_sent_at).getTime()) / 1000);
  return { active: true, waitSeconds: Math.max(0, wait) };
}

export type SendResult = { ok: true } | { ok: false; message: string };

export async function sendLoginCode(u: { sessionId: string; userId: string; email: string; name?: string | null }): Promise<SendResult> {
  const db = createAdminClient();
  const { data: existing } = await db.from("login_otps").select("sends, last_sent_at, expires_at").eq("session_id", u.sessionId).maybeSingle();
  const live = existing && new Date(existing.expires_at).getTime() > Date.now();
  if (live) {
    const since = (Date.now() - new Date(existing.last_sent_at).getTime()) / 1000;
    if (since < RESEND_COOLDOWN_S) return { ok: false, message: `নতুন কোডের জন্য ${Math.ceil(RESEND_COOLDOWN_S - since)} সেকেন্ড অপেক্ষা করুন।` };
    if (existing.sends >= MAX_SENDS) return { ok: false, message: "অনেকবার কোড পাঠানো হয়েছে। কিছুক্ষণ পর আবার লগইন করুন।" };
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const { error } = await db.from("login_otps").upsert({
    session_id: u.sessionId,
    user_id: u.userId,
    code_hash: hash(u.sessionId, code),
    expires_at: new Date(Date.now() + OTP_TTL_MIN * 60_000).toISOString(),
    attempts: 0,
    sends: live ? existing.sends + 1 : 1,
    last_sent_at: new Date().toISOString(),
  });
  if (error) {
    console.error("[otp] store", error.message);
    return { ok: false, message: "কোড তৈরি করা যায়নি। আবার চেষ্টা করুন।" };
  }

  const spaced = code.split("").join(" ");
  const sent = await sendEmail({
    to: u.email,
    subject: `${code} — যাদুল মুসলিম লগইন কোড`,
    html: brandedEmail({
      heading: "লগইন যাচাই কোড",
      paragraphs: [
        "আপনার স্টাফ অ্যাকাউন্টে লগইনের জন্য নিচের কোডটি ব্যবহার করুন:",
        `<span style="display:block;margin:18px 0;padding:16px;border-radius:12px;background:#f6f3ea;border:1px dashed #c9952b;text-align:center;font-size:32px;font-weight:700;letter-spacing:8px;color:#064d26;font-family:Consolas,Menlo,monospace;">${code}</span>`,
        `কোডটি ${OTP_TTL_MIN} মিনিট পর্যন্ত কার্যকর থাকবে। কাউকে এই কোড জানাবেন না — যাদুল মুসলিমের কেউ কখনো আপনার কাছে কোড চাইবে না।`,
        "আপনি লগইন করার চেষ্টা না করে থাকলে কেউ আপনার পাসওয়ার্ড জেনে গেছে — দ্রুত পাসওয়ার্ড পরিবর্তন করুন।",
      ],
    }),
    text: `যাদুল মুসলিম লগইন কোড: ${spaced}\nকোডটি ${OTP_TTL_MIN} মিনিট কার্যকর। কাউকে জানাবেন না।\nআপনি লগইন না করে থাকলে দ্রুত পাসওয়ার্ড পরিবর্তন করুন।`,
  });
  if (!sent.sent) return { ok: false, message: "ইমেইল পাঠানো যায়নি। কিছুক্ষণ পর 'আবার কোড পাঠান' চাপুন।" };
  return { ok: true };
}

export type VerifyResult = "ok" | "invalid" | "expired" | "locked";

export async function checkLoginCode(sessionId: string, userId: string, input: string): Promise<VerifyResult> {
  const db = createAdminClient();
  const code = normalizeDigits(input);
  const { data: row } = await db.from("login_otps").select("code_hash, expires_at, attempts, user_id").eq("session_id", sessionId).maybeSingle();
  if (!row || row.user_id !== userId || new Date(row.expires_at).getTime() < Date.now()) return "expired";
  if (/^\d{6}$/.test(code) && safeEqual(row.code_hash, hash(sessionId, code))) {
    return (await markSessionVerified(sessionId, userId)) ? "ok" : "invalid";
  }
  const attempts = row.attempts + 1;
  if (attempts >= MAX_ATTEMPTS) {
    await db.from("login_otps").delete().eq("session_id", sessionId);
    return "locked";
  }
  await db.from("login_otps").update({ attempts }).eq("session_id", sessionId);
  return "invalid";
}

export function maskEmail(email: string): string {
  const [user = "", domain] = email.split("@");
  if (!domain) return email;
  return `${user.slice(0, 2)}${"•".repeat(Math.max(2, user.length - 2))}@${domain}`;
}
