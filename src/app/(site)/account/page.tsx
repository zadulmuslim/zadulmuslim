import type { Metadata } from "next";
import Link from "next/link";
import { LayoutDashboard, LogOut } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { roleAtLeast, ROLE_LABEL_BN as ROLE_LABEL } from "@/lib/storage/categories";
import { signOut } from "@/app/actions/auth";
import { AvatarUpload, ProfileForm } from "@/components/auth/account-forms";
import { FormMessage } from "@/components/ui/form-message";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/admin/status-badge";

export const metadata: Metadata = { title: "আমার অ্যাকাউন্ট", robots: { index: false } };


export default async function AccountPage({ searchParams }: { searchParams: Promise<{ denied?: string; password?: string; welcome?: string }> }) {
  const user = await requireUser("/account");
  const { denied, password, welcome } = await searchParams;

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("avatar_media_id").eq("id", user.id).maybeSingle();
  let avatarUrl: string | null = null;
  if (profile?.avatar_media_id) {
    const { data: m } = await supabase.from("media").select("public_url").eq("id", profile.avatar_media_id).maybeSingle();
    avatarUrl = m?.public_url ?? null;
  }
  const name = user.displayName ?? user.email?.split("@")[0] ?? "";
  const { data: myQuestions } = await supabase
    .from("questions")
    .select("id, title, status, slug, is_public, created_at")
    .eq("asker_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <section className="mx-auto max-w-2xl px-4 py-10 md:py-14">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-primary">আমার অ্যাকাউন্ট</h1>
        <div className="flex gap-2">
          {roleAtLeast(user.role, "editor") && (
            <Button asChild size="sm">
              <Link href="/admin"><LayoutDashboard />অ্যাডমিন প্যানেল</Link>
            </Button>
          )}
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm"><LogOut />লগআউট</Button>
          </form>
        </div>
      </div>

      {welcome && <FormMessage state={{ ok: true, message: "আসসালামু আলাইকুম! আপনার ইমেইল যাচাই হয়েছে, যাদুল মুসলিমে স্বাগতম।" }} className="mb-4" />}
      {denied && <FormMessage state={{ ok: false, message: "এই পেজে প্রবেশের অনুমতি আপনার নেই।" }} className="mb-4" />}
      {password && <FormMessage state={{ ok: true, message: "পাসওয়ার্ড পরিবর্তন হয়েছে।" }} className="mb-4" />}

      <div className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
        <AvatarUpload url={avatarUrl} initial={name.charAt(0) || "?"} />
        <dl className="grid gap-3 border-y py-4 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">ইমেইল</dt><dd className="font-medium">{user.email}</dd></div>
          <div><dt className="text-muted-foreground">ভূমিকা</dt><dd><Badge>{ROLE_LABEL[user.role]}</Badge></dd></div>
        </dl>
        <ProfileForm displayName={name} />
        <p className="text-sm">
          <Link href="/forgot-password" className="text-primary hover:underline">পাসওয়ার্ড পরিবর্তন করুন</Link>
        </p>
      </div>
      <div className="mt-6 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-primary">আমার প্রশ্ন</h2>
          <Link href="/ask" className="text-sm text-primary hover:underline">নতুন প্রশ্ন</Link>
        </div>
        {myQuestions?.length ? (
          <ul className="divide-y text-sm">
            {myQuestions.map((q) => (
              <li key={q.id} className="flex items-center justify-between gap-3 py-2.5">
                {q.status === "answered" && q.is_public && q.slug ? (
                  <Link href={`/qa/${q.slug}`} className="min-w-0 truncate hover:text-primary">{q.title}</Link>
                ) : (
                  <span className="min-w-0 truncate">{q.title}</span>
                )}
                <StatusBadge status={q.status} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">লগইন অবস্থায় করা প্রশ্নগুলো এখানে দেখাবে।</p>
        )}
      </div>
    </section>
  );
}
