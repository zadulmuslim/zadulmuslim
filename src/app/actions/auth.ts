"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { safeNextPath } from "@/lib/auth/redirect";
import type { FormState } from "@/components/ui/form-message";

const NOT_CONFIGURED: FormState = { ok: false, message: "লগইন ব্যবস্থা এখনো চালু করা হয়নি (Supabase কনফিগারেশন প্রয়োজন)।" };

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

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const parsed = z.object({ email, password: z.string().min(1, { message: "পাসওয়ার্ড লিখুন।" }) }).safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, message: "তথ্যগুলো ঠিকভাবে পূরণ করুন।", fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, message: authError(error.code, "লগইন করা যায়নি। আবার চেষ্টা করুন।") };
  redirect(safeNextPath(formData.get("next"), "/account"));
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

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
