import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { ChangePasswordForm } from "@/components/auth/forms";
import { requireUser } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "পাসওয়ার্ড পরিবর্তন", robots: { index: false } };

export default async function ChangePasswordPage() {
  await requireUser("/account/password");
  return (
    <AuthCard
      title="পাসওয়ার্ড পরিবর্তন"
      subtitle="নিরাপত্তার জন্য বর্তমান পাসওয়ার্ডটি দিয়ে নতুন পাসওয়ার্ড নির্ধারণ করুন"
      footer={
        <Link href="/account" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
          <ArrowLeft className="size-4" /> প্রোফাইলে ফিরে যান
        </Link>
      }
    >
      <ChangePasswordForm />
    </AuthCard>
  );
}
