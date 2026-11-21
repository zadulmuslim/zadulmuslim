"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, ExternalLink, FileText, KeyRound, LogOut, Menu, MessageCircleQuestion, Plus, UserRound, X } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { siteConfig } from "@/config/site";
import { toBnDigits } from "@/lib/utils";
import { AdminNav } from "./admin-nav";

export interface AdminViewer {
  name: string;
  email: string | null;
  roleLabel: string;
  avatarUrl: string | null;
}

function AdminAvatar({ viewer, size = 36 }: { viewer: AdminViewer; size?: number }) {
  return viewer.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={viewer.avatarUrl} alt="" width={size} height={size} className="shrink-0 rounded-full border-2 border-accent object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="grid shrink-0 place-items-center rounded-full border-2 border-accent bg-primary font-bold text-white" style={{ width: size, height: size, fontSize: size * 0.42 }} aria-hidden>
      {viewer.name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

/** Closes a popover on outside click / Escape. */
function useDismiss<T extends HTMLElement>(open: boolean, close: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => ref.current && !ref.current.contains(e.target as Node) && close();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

const menuItem = "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm hover:bg-secondary";

/** Top bar of the admin panel: drawer menu on mobile, quick actions, notifications and account menu. */
export function AdminHeader({ viewer, isAdmin, pendingCount }: { viewer: AdminViewer; isAdmin: boolean; pendingCount: number }) {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const newRef = useDismiss<HTMLDivElement>(newOpen, () => setNewOpen(false));
  const userRef = useDismiss<HTMLDivElement>(userOpen, () => setUserOpen(false));

  useEffect(() => {
    setDrawer(false);
    setNewOpen(false);
    setUserOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawer) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [drawer]);

  const iconBtn = "relative grid size-10 place-items-center rounded-full text-foreground/80 hover:bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="flex h-16 items-center gap-2 px-3 md:px-8">
          <button type="button" className={`${iconBtn} lg:hidden`} onClick={() => setDrawer(true)} aria-label="মেনু খুলুন" aria-expanded={drawer} aria-controls="admin-drawer">
            <Menu className="size-5" />
          </button>
          <Link href="/admin" className="min-w-0 lg:hidden">
            <span className="block truncate font-bold leading-tight text-primary">{siteConfig.nameBn}</span>
            <span className="block text-[11px] leading-tight text-muted-foreground">অ্যাডমিন প্যানেল</span>
          </Link>
          <p className="hidden text-sm text-muted-foreground lg:block">
            আসসালামু আলাইকুম, <span className="font-semibold text-foreground">{viewer.name}</span>
          </p>

          <div className="ml-auto flex items-center gap-1">
            <div ref={newRef} className="relative">
              <button
                type="button"
                onClick={() => setNewOpen((o) => !o)}
                aria-expanded={newOpen}
                aria-haspopup="menu"
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-3 text-sm font-semibold text-white hover:bg-primary/90 sm:px-4"
              >
                <Plus className="size-4" /> <span className="hidden sm:inline">নতুন</span>
                <ChevronDown className="hidden size-3.5 sm:block" />
              </button>
              {newOpen && (
                <div role="menu" className="absolute right-0 top-12 w-56 rounded-xl border bg-card p-1.5 shadow-lg">
                  <Link role="menuitem" href="/admin/questions/new" className={menuItem}><MessageCircleQuestion className="size-4 text-primary" />নতুন প্রশ্নোত্তর</Link>
                  <Link role="menuitem" href="/admin/articles/new" className={menuItem}><FileText className="size-4 text-primary" />নতুন প্রবন্ধ</Link>
                </div>
              )}
            </div>

            <Link href="/admin/questions?status=pending" className={iconBtn} aria-label={`অপেক্ষমাণ প্রশ্ন: ${toBnDigits(pendingCount)}টি`} title="অপেক্ষমাণ প্রশ্ন">
              <Bell className="size-5" />
              {pendingCount > 0 && (
                <span className="absolute right-1 top-1 grid min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold leading-[18px] text-brand-deep">
                  {pendingCount > 99 ? "৯৯+" : toBnDigits(pendingCount)}
                </span>
              )}
            </Link>

            <Link href="/" className={`${iconBtn} hidden sm:grid`} aria-label="সাইট দেখুন" title="সাইট দেখুন">
              <ExternalLink className="size-[18px]" />
            </Link>

            <div ref={userRef} className="relative">
              <button type="button" onClick={() => setUserOpen((o) => !o)} aria-expanded={userOpen} aria-haspopup="menu" aria-label="অ্যাকাউন্ট মেনু" className="flex items-center gap-2 rounded-full p-1 hover:bg-secondary">
                <AdminAvatar viewer={viewer} />
                <span className="hidden text-left leading-tight md:block">
                  <span className="block max-w-[140px] truncate text-sm font-semibold">{viewer.name}</span>
                  <span className="block text-[11px] text-muted-foreground">{viewer.roleLabel}</span>
                </span>
                <ChevronDown className="hidden size-3.5 text-muted-foreground md:block" />
              </button>
              {userOpen && (
                <div role="menu" className="absolute right-0 top-12 w-64 rounded-xl border bg-card p-1.5 shadow-lg">
                  <div className="flex items-center gap-3 border-b px-3 pb-3 pt-2">
                    <AdminAvatar viewer={viewer} size={40} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{viewer.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{viewer.email}</p>
                      <p className="mt-0.5 inline-block rounded-full bg-secondary px-2 text-[11px] font-medium">{viewer.roleLabel}</p>
                    </div>
                  </div>
                  <div className="pt-1.5">
                    <Link role="menuitem" href="/account" className={menuItem}><UserRound className="size-4 text-primary" />আমার প্রোফাইল</Link>
                    <Link role="menuitem" href="/account/password" className={menuItem}><KeyRound className="size-4 text-primary" />পাসওয়ার্ড পরিবর্তন</Link>
                    <Link role="menuitem" href="/" className={menuItem}><ExternalLink className="size-4 text-primary" />সাইট দেখুন</Link>
                    <form action={signOut}>
                      <button role="menuitem" type="submit" className={`${menuItem} text-destructive`}><LogOut className="size-4" />লগআউট</button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-50 lg:hidden ${drawer ? "" : "pointer-events-none"}`} aria-hidden={!drawer}>
        <div className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${drawer ? "opacity-100" : "opacity-0"}`} onClick={() => setDrawer(false)} />
        <aside
          id="admin-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="অ্যাডমিন মেনু"
          className={`absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col border-r-4 border-accent bg-brand-deep transition-[transform,visibility] duration-300 motion-reduce:transition-none ${drawer ? "visible translate-x-0" : "invisible -translate-x-full"}`}
        >
          <div className="flex items-center justify-between px-4 py-4">
            <Link href="/admin">
              <span className="block text-lg font-bold text-white">{siteConfig.nameBn}</span>
              <span className="block text-xs text-accent">অ্যাডমিন প্যানেল</span>
            </Link>
            <button type="button" onClick={() => setDrawer(false)} className="grid size-10 place-items-center rounded-full text-white hover:bg-white/10" aria-label="মেনু বন্ধ করুন">
              <X className="size-5" />
            </button>
          </div>
          <nav aria-label="অ্যাডমিন মেনু" className="min-h-0 flex-1 overflow-y-auto px-3">
            <AdminNav isAdmin={isAdmin} pendingCount={pendingCount} vertical />
          </nav>
          <div className="border-t border-white/15 p-4">
            <div className="flex items-center gap-3">
              <AdminAvatar viewer={viewer} />
              <div className="min-w-0 text-white">
                <p className="truncate text-sm font-semibold">{viewer.name}</p>
                <p className="text-xs text-white/70">{viewer.roleLabel}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <Link href="/" className="rounded-lg bg-white/10 px-3 py-2 text-center text-white hover:bg-white/15">সাইট দেখুন</Link>
              <form action={signOut}>
                <button type="submit" className="w-full rounded-lg bg-white/10 px-3 py-2 text-white hover:bg-white/15">লগআউট</button>
              </form>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
