import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/forms";
import { requireUser } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "নতুন পাসওয়ার্ড", robots: { index: false } };

export default async function ResetPasswordPage() {
  await requireUser("/reset-password");
  return (
    <AuthCard
      title="নতুন পাসওয়ার্ড দিন"
      subtitle="আপনার অ্যাকাউন্টের জন্য একটি শক্তিশালী নতুন পাসওয়ার্ড নির্ধারণ করুন"
      footer={<Link href="/account" className="font-semibold text-primary hover:underline">প্রোফাইলে যান</Link>}
    >
      <ResetPasswordForm />
    </AuthCard>
  );
}
