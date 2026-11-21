import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forms";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "পাসওয়ার্ড রিসেট", robots: { index: false } };

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams;
  const signedIn = Boolean(await getSessionUser());
  return (
    <AuthCard
      title="পাসওয়ার্ড ভুলে গেছেন?"
      subtitle="ইমেইল দিন, পাসওয়ার্ড পরিবর্তনের লিংক পাঠানো হবে"
      footer={
        signedIn ? (
          <Link href="/account" className="font-semibold text-primary hover:underline">প্রোফাইলে ফিরে যান</Link>
        ) : (
          <Link href="/login" className="font-semibold text-primary hover:underline">লগইন পেজে ফিরে যান</Link>
        )
      }
    >
      <ForgotPasswordForm
        initialState={
          notice === "other_browser"
            ? { ok: false, message: "পাসওয়ার্ড রিসেটের লিংকটি অন্য ব্রাউজারে খোলা হয়েছে। নিচে আবার ইমেইল দিন — নতুন লিংকটি যে ব্রাউজার থেকে অনুরোধ করবেন, সেখানেই খুলুন।" }
            : null
        }
      />
    </AuthCard>
  );
}
