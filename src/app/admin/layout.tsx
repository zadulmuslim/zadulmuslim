import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requireStaff } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { siteConfig } from "@/config/site";
import { AdminNav } from "@/components/admin/admin-nav";
import { signOut } from "@/app/actions/auth";

export const metadata: Metadata = {
  title: { default: "অ্যাডমিন প্যানেল", template: `%s · অ্যাডমিন | ${siteConfig.nameBn}` },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff("/admin");
  const supabase = await createClient();
  const { count } = await supabase.from("questions").select("id", { count: "exact", head: true }).eq("status", "pending");

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 z-20 bg-brand-deep lg:h-screen lg:border-r-4 lg:border-accent">
        <div className="flex items-center justify-between gap-2 px-4 py-3 lg:block lg:py-5">
          <Link href="/admin" className="block">
            <span className="block text-lg font-bold text-white">{siteConfig.nameBn}</span>
            <span className="block text-xs text-accent">অ্যাডমিন প্যানেল</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-1 text-xs text-white/70 hover:text-white lg:mt-2">
            সাইট দেখুন <ExternalLink className="size-3" />
          </Link>
        </div>
        <nav aria-label="অ্যাডমিন মেনু" className="px-3 pb-3 lg:pb-0">
          <AdminNav isAdmin={user.role === "admin"} pendingCount={count ?? 0} />
        </nav>
        <div className="hidden border-t border-white/15 px-4 py-4 text-xs text-white/70 lg:absolute lg:inset-x-0 lg:bottom-0 lg:block">
          <p className="truncate font-medium text-white">{user.displayName ?? user.email}</p>
          <p>{user.role === "admin" ? "অ্যাডমিন" : "সম্পাদক"}</p>
          <div className="mt-2 flex gap-3">
            <Link href="/account" className="hover:text-white hover:underline">অ্যাকাউন্ট</Link>
            <form action={signOut}><button type="submit" className="hover:text-white hover:underline">লগআউট</button></form>
          </div>
        </div>
      </aside>
      <main id="main" className="min-w-0 px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
