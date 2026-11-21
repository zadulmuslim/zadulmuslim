import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "পাসওয়ার্ড রিসেট", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="পাসওয়ার্ড ভুলে গেছেন?"
      subtitle="ইমেইল দিন, পাসওয়ার্ড পরিবর্তনের লিংক পাঠানো হবে"
      footer={<Link href="/login" className="font-semibold text-primary hover:underline">লগইন পেজে ফিরে যান</Link>}
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
