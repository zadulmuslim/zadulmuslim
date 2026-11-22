import { GoogleSignIn } from "@/components/auth/google-button";
import { googleAuthEnabled } from "@/lib/auth/finish-sign-in";
import { issueChallenge } from "@/lib/captcha";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/forms";
import { getSessionUser } from "@/lib/auth/session";
import { safeNextPath } from "@/lib/auth/redirect";
import type { FormState } from "@/components/ui/form-message";

export const metadata: Metadata = { title: "লগইন", robots: { index: false } };

const NOTICES: Record<string, FormState> = {
  google_failed: { ok: false, message: "Google দিয়ে লগইন সম্পন্ন হয়নি। আবার চেষ্টা করুন, অথবা ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন।" },
  google_cancelled: { ok: false, message: "Google লগইন বাতিল করা হয়েছে।" },
  google_unavailable: { ok: false, message: "Google দিয়ে লগইন এই মুহূর্তে চালু নেই। ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন।" },
  confirmed_login: { ok: true, message: "আলহামদুলিল্লাহ, আপনার ইমেইল যাচাই হয়েছে। এখন ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন।" },
  already_confirmed: { ok: true, message: "আপনার ইমেইল আগেই যাচাই করা হয়েছে। লগইন করুন।" },
  link_expired: { ok: false, message: "লিংকটির মেয়াদ শেষ হয়ে গেছে। লগইন করার চেষ্টা করুন, অথবা আবার সাইন-আপ/পাসওয়ার্ড রিসেট করুন।" },
  otp_locked: { ok: false, message: "অনেকবার ভুল কোড দেওয়া হয়েছে, তাই নিরাপত্তার জন্য লগআউট করা হয়েছে। আবার লগইন করুন।" },
  link_invalid: { ok: false, message: "লিংকটি কাজ করেনি। ইমেইল আগে যাচাই হয়ে থাকলে সরাসরি লগইন করুন।" },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; notice?: string }> }) {
  const { next, error, notice } = await searchParams;
  if (await getSessionUser()) redirect(safeNextPath(next, "/account"));
  return (
    <AuthCard
      title="লগইন করুন"
      subtitle="আপনার অ্যাকাউন্টে প্রবেশ করুন"
      footer={<>অ্যাকাউন্ট নেই? <Link href="/signup" className="font-semibold text-primary hover:underline">নতুন অ্যাকাউন্ট খুলুন</Link></>}
    >
      {googleAuthEnabled() && <GoogleSignIn next={safeNextPath(next, "")} />}
      <LoginForm captcha={issueChallenge()} next={safeNextPath(next, "")} initialState={NOTICES[notice ?? (error === "link" ? "link_invalid" : "")] ?? null} />
    </AuthCard>
  );
}
