"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { LogIn, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Client-side so public pages stay statically rendered (no cookies read on the server).
 */
export function AuthButton() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const pathname = usePathname();

  // Login/logout happen in Server Actions (cookies set by the server), so the
  // browser client gets no auth event. Re-read the session cookie on every
  // navigation — it is a local read, no network request.
  useEffect(() => {
    if (!isSupabaseConfigured()) return setSignedIn(false);
    createClient().auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, [pathname]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const { data: sub } = createClient().auth.onAuthStateChange((_e, session) => setSignedIn(!!session));
    return () => sub.subscription.unsubscribe();
  }, []);

  const base = "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors";
  if (signedIn) {
    return (
      <Link href="/account" className={`${base} bg-white/10 text-white hover:bg-white/20`}>
        <UserRound className="size-4" aria-hidden />
        <span className="hidden sm:inline">আমার অ্যাকাউন্ট</span>
        <span className="sr-only sm:hidden">আমার অ্যাকাউন্ট</span>
      </Link>
    );
  }
  return (
    <Link href="/login" className={`${base} bg-accent text-brand-deep hover:bg-accent/90 ${signedIn === null ? "opacity-0" : ""}`}>
      <LogIn className="size-4" aria-hidden />
      লগইন
    </Link>
  );
}
