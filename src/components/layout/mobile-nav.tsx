"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LayoutDashboard, LogIn, LogOut, Mail, Menu, MessageCircleQuestion, UserPlus, UserRound, X } from "lucide-react";
import { navGroups, quickLinks, siteConfig } from "@/config/site";
import { signOut } from "@/app/actions/auth";
import { roleAtLeast, ROLE_LABEL_BN } from "@/lib/storage/categories";
import { Avatar, useViewer } from "./viewer";
import { cn } from "@/lib/utils";

/** Full-screen mobile drawer: account, quick tiles, grouped sections, CTA. */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<number | null>(null);
  const pathname = usePathname();
  const viewer = useViewer();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid size-10 place-items-center rounded-full text-white hover:bg-white/10"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label="মেনু খুলুন"
      >
        <Menu className="size-5" />
      </button>

      <div
        className={cn("fixed inset-0 z-50 bg-black/50 transition-opacity", open ? "opacity-100" : "pointer-events-none opacity-0")}
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <aside
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="মেনু"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[88%] max-w-sm flex-col bg-background transition-[transform,visibility,box-shadow] duration-300 motion-reduce:transition-none",
          open ? "visible translate-x-0 shadow-2xl" : "invisible -translate-x-full shadow-none",
        )}
      >
        <div className="flex items-center justify-between bg-brand-deep px-4 py-3 text-white">
          <span className="font-bold">{siteConfig.nameBn}</span>
          <button type="button" onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-full hover:bg-white/10" aria-label="মেনু বন্ধ করুন">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Account */}
          <div className="border-b px-4 py-4">
            {viewer.status === "signed-in" ? (
              <div>
                <div className="flex items-center gap-3">
                  <Avatar viewer={viewer} size={44} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{viewer.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {viewer.role && viewer.role !== "member" ? ROLE_LABEL_BN[viewer.role] : viewer.email}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <Link href="/account" className="flex items-center justify-center gap-1.5 rounded-lg border bg-card py-2 font-medium"><UserRound className="size-4 text-primary" />অ্যাকাউন্ট</Link>
                  {roleAtLeast(viewer.role, "editor") ? (
                    <Link href="/admin" className="flex items-center justify-center gap-1.5 rounded-lg border bg-card py-2 font-medium"><LayoutDashboard className="size-4 text-primary" />অ্যাডমিন</Link>
                  ) : (
                    <form action={signOut}>
                      <button type="submit" className="flex w-full items-center justify-center gap-1.5 rounded-lg border bg-card py-2 font-medium text-destructive"><LogOut className="size-4" />লগআউট</button>
                    </form>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Link href="/login" className="flex items-center justify-center gap-1.5 rounded-full bg-primary py-2.5 font-semibold text-white"><LogIn className="size-4" />লগইন</Link>
                <Link href="/signup" className="flex items-center justify-center gap-1.5 rounded-full border border-primary py-2.5 font-semibold text-primary"><UserPlus className="size-4" />অ্যাকাউন্ট খুলুন</Link>
              </div>
            )}
          </div>

          {/* Quick tiles */}
          <div className="grid grid-cols-4 gap-2 border-b px-4 py-4">
            {quickLinks.slice(0, 8).map((q) => (
              <Link key={q.label} href={q.href} className={cn("flex flex-col items-center gap-1 rounded-xl border bg-card px-1 py-2.5 text-center", pathname === q.href && "border-accent")}>
                <span className="text-xl" aria-hidden>{q.icon}</span>
                <span className="text-[11px] leading-tight">{q.label}</span>
              </Link>
            ))}
          </div>

          {/* Grouped sections (accordion) */}
          <ul className="divide-y">
            {navGroups.map((g, i) => (
              <li key={g.label}>
                <button
                  type="button"
                  onClick={() => setSection(section === i ? null : i)}
                  aria-expanded={section === i}
                  className="flex w-full items-center justify-between px-4 py-3.5 text-left"
                >
                  <span>
                    <span className="block font-semibold">{g.label}</span>
                    <span className="block text-xs text-muted-foreground">{g.description}</span>
                  </span>
                  <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", section === i && "rotate-180")} />
                </button>
                {section === i && (
                  <ul className="bg-secondary/40 px-4 pb-3 pt-1">
                    {g.columns.flatMap((c) => c.links).map((l) => (
                      <li key={l.label}>
                        <Link href={l.href} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-secondary">
                          {l.icon && <span aria-hidden>{l.icon}</span>}
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="p-4">
            <Link href="/ask" className="flex items-center justify-center gap-2 rounded-xl bg-brand-deep px-4 py-3.5 font-semibold text-white">
              <MessageCircleQuestion className="size-5 text-accent" />
              আলেমগণকে প্রশ্ন করুন
            </Link>
          </div>
        </div>

        <div className="border-t px-4 py-3 text-xs text-muted-foreground">
          <a href={`mailto:${siteConfig.contact.email}`} className="flex items-center gap-1.5 hover:text-primary"><Mail className="size-3.5" />{siteConfig.contact.email}</a>
          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            <Link href="/about" onClick={() => setOpen(false)} className="hover:text-primary">আমাদের সম্পর্কে</Link>
            <Link href="/contact" onClick={() => setOpen(false)} className="hover:text-primary">যোগাযোগ</Link>
            <Link href="/privacy" onClick={() => setOpen(false)} className="hover:text-primary">গোপনীয়তা</Link>
            <Link href="/terms" onClick={() => setOpen(false)} className="hover:text-primary">শর্তাবলি</Link>
          </p>
          <p className="mt-1">© {siteConfig.copyrightYear} {siteConfig.nameBn}</p>
        </div>
      </aside>
    </div>
  );
}
