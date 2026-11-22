"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { navGroups } from "@/config/site";
import { cn } from "@/lib/utils";

/** Desktop mega menu: hover or click a group to open a wide panel with columns + a featured card. */
export function MegaMenu() {
  const [open, setOpen] = useState<number | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const root = useRef<HTMLElement>(null);
  const pathname = usePathname();

  useEffect(() => setOpen(null), [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    const onDown = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(null);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, []);

  const cancelClose = () => closeTimer.current && clearTimeout(closeTimer.current);
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(null), 160);
  };

  const group = open !== null ? navGroups[open] : null;

  return (
    <nav ref={root} aria-label="প্রধান মেনু" className="hidden lg:block" onMouseLeave={scheduleClose} onMouseEnter={cancelClose}>
      <ul className="flex items-center gap-0.5">
        {navGroups.map((g, i) => {
          const active = pathname.startsWith(g.href.split("?")[0]!);
          return (
            <li key={g.label}>
              <button
                type="button"
                aria-expanded={open === i}
                aria-controls={`mega-${i}`}
                onMouseEnter={() => {
                  cancelClose();
                  setOpen(i);
                }}
                onClick={() => setOpen(open === i ? null : i)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm transition-colors",
                  open === i || active ? "bg-white/15 text-white" : "text-white/90 hover:bg-white/10 hover:text-white",
                )}
              >
                {g.label}
                <ChevronDown className={cn("size-3.5 transition-transform", open === i && "rotate-180")} aria-hidden />
              </button>
            </li>
          );
        })}
        <li>
          <Link href="/ask" className="ml-1 rounded-full border border-accent/70 px-3 py-1.5 text-sm font-semibold text-accent hover:bg-accent hover:text-brand-deep">
            প্রশ্ন করুন
          </Link>
        </li>
      </ul>

      {group && open !== null && (
        <div id={`mega-${open}`} className="absolute inset-x-0 top-full z-40 border-b-2 border-accent bg-card text-foreground shadow-2xl">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-7 md:grid-cols-[1fr_1fr_300px]">
            {group.columns.map((col) => (
              <div key={col.title}>
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-accent">{col.title}</p>
                <ul className="space-y-1">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="group flex items-start gap-3 rounded-lg px-3 py-2 hover:bg-secondary">
                        {l.icon && <span className="mt-0.5 text-xl" aria-hidden>{l.icon}</span>}
                        <span>
                          <span className="block font-semibold text-foreground group-hover:text-primary">{l.label}</span>
                          {l.description && <span className="block text-xs text-muted-foreground">{l.description}</span>}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="rounded-xl bg-brand-deep p-5 text-white">
              <p className="text-xs text-accent">{group.description}</p>
              {group.feature ? (
                <>
                  <p className="mt-2 text-lg font-bold">{group.feature.title}</p>
                  <p className="mt-1 text-sm text-white/80">{group.feature.body}</p>
                  <Link href={group.feature.href} className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-brand-deep hover:bg-accent/90">
                    {group.feature.cta} <ArrowLeft className="size-4 rotate-180" />
                  </Link>
                </>
              ) : (
                <Link href={group.href} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
                  সব দেখুন <ArrowLeft className="size-4 rotate-180" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
