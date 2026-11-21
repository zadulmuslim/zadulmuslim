"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogIn, LogOut, UserRound } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { roleAtLeast, ROLE_LABEL_BN } from "@/lib/storage/categories";
import { Avatar, useViewer } from "./viewer";

export function UserMenu() {
  const viewer = useViewer();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (viewer.status === "loading") return <span className="size-9 rounded-full bg-white/10" aria-hidden />;

  if (viewer.status === "anonymous") {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-[13px] font-semibold text-brand-deep hover:bg-accent/90"
      >
        <LogIn className="size-4" aria-hidden />
        লগইন
      </Link>
    );
  }

  const staff = roleAtLeast(viewer.role, "editor");
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="অ্যাকাউন্ট মেনু"
        className="flex items-center rounded-full p-0.5 ring-white/30 transition hover:ring-2 focus-visible:ring-2"
      >
        <Avatar viewer={viewer} size={36} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border bg-card text-foreground shadow-xl">
          <div className="flex items-center gap-3 border-b bg-secondary/40 px-4 py-3">
            <Avatar viewer={viewer} size={40} />
            <div className="min-w-0">
              <p className="truncate font-semibold">{viewer.name}</p>
              <p className="truncate text-xs text-muted-foreground">{viewer.email}</p>
              {viewer.role && viewer.role !== "member" && (
                <p className="mt-0.5 text-[11px] font-semibold text-accent">{ROLE_LABEL_BN[viewer.role]}</p>
              )}
            </div>
          </div>
          <div className="p-1.5 text-sm">
            <Link role="menuitem" href="/account" className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-secondary">
              <UserRound className="size-4 text-primary" /> আমার অ্যাকাউন্ট
            </Link>
            {staff && (
              <Link role="menuitem" href="/admin" className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-secondary">
                <LayoutDashboard className="size-4 text-primary" /> অ্যাডমিন প্যানেল
              </Link>
            )}
            <form action={signOut}>
              <button role="menuitem" type="submit" className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-destructive hover:bg-destructive/5">
                <LogOut className="size-4" /> লগআউট
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
