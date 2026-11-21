import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/forms";
import { getSessionUser } from "@/lib/auth/session";
import { safeNextPath } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "লগইন", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  if (await getSessionUser()) redirect(safeNextPath(next, "/account"));
  return (
    <AuthCard
      title="লগইন করুন"
      subtitle="আপনার অ্যাকাউন্টে প্রবেশ করুন"
      footer={<>অ্যাকাউন্ট নেই? <Link href="/signup" className="font-semibold text-primary hover:underline">নতুন অ্যাকাউন্ট খুলুন</Link></>}
    >
      <LoginForm next={safeNextPath(next, "")} linkError={error === "link"} />
    </AuthCard>
  );
}
