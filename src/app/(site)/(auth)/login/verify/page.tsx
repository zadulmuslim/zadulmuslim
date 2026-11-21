import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { OtpForm } from "@/components/auth/otp-form";
import { getSessionUser } from "@/lib/auth/session";
import { safeNextPath } from "@/lib/auth/redirect";
import { maskEmail, OTP_TTL_MIN, pendingCode } from "@/lib/auth/otp";
import { hasSupabaseAdmin } from "@/lib/env";
import { signOut } from "@/app/actions/auth";

export const metadata: Metadata = { title: "লগইন যাচাই", robots: { index: false } };

export default async function VerifyLoginPage({ searchParams }: { searchParams: Promise<{ next?: string; sent?: string }> }) {
  const { next: rawNext, sent } = await searchParams;
  const next = safeNextPath(rawNext, "/admin");
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (!user.needsOtp) redirect(next);

  const pending = user.sessionId && hasSupabaseAdmin() ? await pendingCode(user.sessionId) : { active: false, waitSeconds: 0 };
  return (
    <AuthCard
      title="লগইন যাচাই করুন"
      subtitle="স্টাফ অ্যাকাউন্টের অতিরিক্ত নিরাপত্তা"
      footer={
        <form action={signOut}>
          অন্য অ্যাকাউন্টে যেতে চান? <button type="submit" className="font-semibold text-primary hover:underline">লগআউট</button>
        </form>
      }
    >
      <OtpForm
        next={next}
        email={user.email ? maskEmail(user.email) : "আপনার ইমেইল"}
        active={pending.active}
        justSent={sent === "1"}
        initialWait={pending.waitSeconds}
        ttl={OTP_TTL_MIN}
      />
    </AuthCard>
  );
}
