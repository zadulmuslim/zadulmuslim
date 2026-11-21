"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { UserRole } from "@/lib/storage/categories";

/**
 * Who is looking at the public site — read in the browser so public pages
 * stay static and CDN-cached. The session is read from the cookie (no network);
 * the small profile query runs once per user, and again after visiting /account
 * (where name/photo can change).
 */
export interface Viewer {
  status: "loading" | "anonymous" | "signed-in";
  name?: string;
  email?: string;
  avatarUrl?: string | null;
  role?: UserRole;
}

const ViewerContext = createContext<Viewer>({ status: "loading" });
export const useViewer = () => useContext(ViewerContext);

export function ViewerProvider({ children }: { children: React.ReactNode }) {
  const [viewer, setViewer] = useState<Viewer>({ status: "loading" });
  const pathname = usePathname();
  const loadedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return setViewer({ status: "anonymous" });
    const supabase = createClient();
    let cancelled = false;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (cancelled) return;
      if (!user) {
        loadedFor.current = null;
        return setViewer({ status: "anonymous" });
      }
      const refresh = loadedFor.current !== user.id || pathname.startsWith("/account");
      if (!refresh) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, role, avatar:avatar_media_id(public_url)")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      loadedFor.current = user.id;
      setViewer({
        status: "signed-in",
        email: user.email ?? undefined,
        name: profile?.display_name ?? user.email?.split("@")[0],
        avatarUrl: profile?.avatar?.public_url ?? null,
        role: profile?.role ?? "member",
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const { data: sub } = createClient().auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        loadedFor.current = null;
        setViewer({ status: "anonymous" });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return <ViewerContext.Provider value={viewer}>{children}</ViewerContext.Provider>;
}

export function Avatar({ viewer, size = 32, className = "" }: { viewer: Viewer; size?: number; className?: string }) {
  const initial = (viewer.name ?? viewer.email ?? "?").trim().charAt(0).toUpperCase();
  return viewer.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={viewer.avatarUrl}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 rounded-full border-2 border-accent object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className={`grid shrink-0 place-items-center rounded-full border-2 border-accent bg-primary font-bold text-white ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden
    >
      {initial}
    </span>
  );
}
