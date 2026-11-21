import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/forms";
import { requireUser } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "নতুন পাসওয়ার্ড", robots: { index: false } };

export default async function ResetPasswordPage() {
  await requireUser("/reset-password");
  return (
    <AuthCard title="নতুন পাসওয়ার্ড দিন">
      <ResetPasswordForm />
    </AuthCard>
  );
}
