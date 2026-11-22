import { issueChallenge } from "@/lib/captcha";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { SignupForm } from "@/components/auth/forms";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "নতুন অ্যাকাউন্ট", robots: { index: false } };

export default async function SignupPage() {
  if (await getSessionUser()) redirect("/account");
  return (
    <AuthCard
      title="নতুন অ্যাকাউন্ট খুলুন"
      subtitle="প্রশ্ন করতে ও উত্তর অনুসরণ করতে অ্যাকাউন্ট খুলুন"
      footer={<>আগেই অ্যাকাউন্ট আছে? <Link href="/login" className="font-semibold text-primary hover:underline">লগইন করুন</Link></>}
    >
      <SignupForm captcha={issueChallenge()} />
    </AuthCard>
  );
}
