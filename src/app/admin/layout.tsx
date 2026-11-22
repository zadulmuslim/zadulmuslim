import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requireStaff } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { siteConfig } from "@/config/site";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminFooter } from "@/components/admin/admin-footer";
import { roleAtLeast, ROLE_LABEL_BN } from "@/lib/storage/categories";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdmin } from "@/lib/env";

/** Comments with at least one open report (comment tables are server-only). */
async function reportedCommentCount(): Promise<number> {
  if (!hasSupabaseAdmin()) return 0;
  const { data } = await createAdminClient().from("comment_reports").select("comment_id").limit(2000);
  return new Set((data ?? []).map((r) => r.comment_id)).size;
}

export const metadata: Metadata = {
  title: { default: "অ্যাডমিন প্যানেল", template: `%s · অ্যাডমিন | ${siteConfig.nameBn}` },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff("/admin");
  const supabase = await createClient();
  const [{ count }, { data: profile }, reported] = await Promise.all([
    supabase.from("questions").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("profiles").select("avatar:avatar_media_id(public_url)").eq("id", user.id).maybeSingle(),
    reportedCommentCount(),
  ]);
  const avatar = (profile as { avatar: { public_url: string | null } | null } | null)?.avatar?.public_url ?? null;
  const isAdmin = roleAtLeast(user.role, "admin");
  const viewer = {
    name: user.displayName ?? user.email?.split("@")[0] ?? "স্টাফ",
    email: user.email,
    roleLabel: ROLE_LABEL_BN[user.role],
    avatarUrl: avatar,
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="hidden bg-brand-deep lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-r-4 lg:border-accent">
        <div className="px-5 py-5">
          <Link href="/admin" className="block">
            <span className="block text-lg font-bold text-white">{siteConfig.nameBn}</span>
            <span className="block text-xs text-accent">অ্যাডমিন প্যানেল</span>
          </Link>
        </div>
        <nav aria-label="অ্যাডমিন মেনু" className="min-h-0 flex-1 overflow-y-auto px-3">
          <AdminNav isAdmin={isAdmin} pendingCount={count ?? 0} />
        </nav>
        <div className="border-t border-white/15 px-5 py-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-white/75 hover:text-white">
            <ExternalLink className="size-3.5" /> পাবলিক সাইট দেখুন
          </Link>
        </div>
      </aside>
      <div className="flex min-h-screen min-w-0 flex-col">
        <AdminHeader viewer={viewer} isAdmin={isAdmin} pendingCount={count ?? 0} />
        <main id="main" className="flex min-w-0 flex-1 flex-col px-4 py-6 md:px-8 md:py-8">
          <div className="min-h-[calc(100vh-14rem)] flex-1">{children}</div>
          <AdminFooter viewer={viewer} pendingQuestions={count ?? 0} reportedComments={reported} />
        </main>
      </div>
    </div>
  );
}
