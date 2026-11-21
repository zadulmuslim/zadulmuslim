"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Search, X } from "lucide-react";

/** Search icon in the header that opens a full-width search bar under it. */
export function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (open) input.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      // "/" opens search like most sites
      if (e.key === "/" && !open && !(e.target as HTMLElement)?.closest("input,textarea,[contenteditable]")) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="header-search"
        aria-label={open ? "সার্চ বন্ধ করুন" : "সার্চ করুন"}
        className="grid size-10 place-items-center rounded-full text-white hover:bg-white/10"
      >
        {open ? <X className="size-5" /> : <Search className="size-5" />}
      </button>
      {open && (
        <div id="header-search" className="absolute inset-x-0 top-full z-40 border-b-2 border-accent bg-brand-deep/98 px-4 py-4 shadow-lg backdrop-blur">
          <form action="/search" method="get" role="search" className="mx-auto flex max-w-3xl items-center gap-2 rounded-full bg-white p-1.5">
            <Search className="ml-3 size-5 shrink-0 text-muted-foreground" aria-hidden />
            <label htmlFor="header-q" className="sr-only">অনুসন্ধান</label>
            <input
              ref={input}
              id="header-q"
              name="q"
              type="search"
              required
              placeholder="প্রশ্নোত্তর, প্রবন্ধ বা মাসআলা খুঁজুন…"
              className="h-10 min-w-0 flex-1 bg-transparent px-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <button type="submit" className="h-10 rounded-full bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90">
              খুঁজুন
            </button>
          </form>
        </div>
      )}
    </>
  );
}
