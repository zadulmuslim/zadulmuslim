"use client";
import { OPEN_SEARCH_EVENT } from "@/components/search/open-search";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Clock, CornerDownLeft, FileText, Library, Loader2, MessageCircleQuestion, PlayCircle, ScrollText, Search, Sparkles, X } from "lucide-react";
import { addRecent, clearRecent, getRecent, useLiveSearch } from "@/components/search/use-live-search";
import { Highlight } from "@/components/search/highlight";
import { cn, toBnDigits } from "@/lib/utils";

const ICON: Record<string, React.ElementType> = { quran: BookOpen, hadith: ScrollText, qa: MessageCircleQuestion, articles: FileText, lectures: PlayCircle, books: Library };
const SUGGESTIONS = ["আয়াতুল কুরসী", "নামাজের সময়", "যাকাত", "সূরা ইয়াসীন", "সকাল-সন্ধ্যার যিকির", "নিয়ত", "ওযু", "রোযা"];

/** Search button in the header that opens a live-search palette (also "/" or Ctrl+K). */
export function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest("input,textarea,[contenteditable]");
      if ((e.key === "/" && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        setOpen(true);
      }
    };
    const onOpen = () => setOpen(true);
    document.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_SEARCH_EVENT, onOpen);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpen);
    };
  }, []);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label="সার্চ করুন (/)" title="সার্চ করুন (/)" className="grid size-10 place-items-center rounded-full text-white hover:bg-white/10">
        <Search className="size-5" />
      </button>
      {open && mounted && createPortal(<SearchPalette onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

function SearchPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const { data, loading, error } = useLiveSearch(q, { limit: 4 });

  useEffect(() => {
    setRecent(getRecent());
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    input.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Flat list of selectable items for keyboard navigation.
  const items = useMemo(() => {
    if (!q.trim()) return recent.map((r) => ({ kind: "recent" as const, href: `/search?q=${encodeURIComponent(r)}`, label: r }));
    const out: { kind: "shortcut" | "hit" | "all"; href: string; label: string }[] = [];
    data?.shortcuts.forEach((s) => out.push({ kind: "shortcut", href: s.href, label: s.title }));
    data?.groups.forEach((g) => g.hits.forEach((h) => out.push({ kind: "hit", href: h.href, label: h.title })));
    if (q.trim()) out.push({ kind: "all", href: `/search?q=${encodeURIComponent(q.trim())}`, label: "all" });
    return out;
  }, [q, data, recent]);

  useEffect(() => setActive(0), [q, data]);
  useEffect(() => {
    list.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = useCallback(
    (href: string) => {
      if (q.trim()) addRecent(q);
      onClose();
      router.push(href);
    },
    [q, onClose, router],
  );

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") return onClose();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(items.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = items[active];
      if (it) go(it.href);
      else if (q.trim()) go(`/search?q=${encodeURIComponent(q.trim())}`);
    }
  }

  let idx = -1;
  const itemCls = (i: number) => cn("flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition", i === active ? "bg-primary/10" : "hover:bg-secondary/60");
  const hasResults = Boolean(data && (data.shortcuts.length || data.total));

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-[#0a1b28]/60 backdrop-blur-[2px] sm:p-6 sm:pt-[10vh]" onMouseDown={(e) => e.target === e.currentTarget && onClose()} onKeyDown={onKeyDown}>
      <div role="dialog" aria-modal="true" aria-label="অনুসন্ধান" className="flex h-full w-full flex-col overflow-hidden bg-card shadow-2xl sm:h-auto sm:max-h-[78vh] sm:max-w-2xl sm:rounded-2xl">
        <div className="flex items-center gap-2 border-b px-4">
          {loading ? <Loader2 className="size-5 shrink-0 animate-spin text-primary" /> : <Search className="size-5 shrink-0 text-muted-foreground" />}
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="কুরআন, হাদীস, প্রশ্নোত্তর খুঁজুন…"
            aria-label="অনুসন্ধান"
            aria-controls="search-results"
            aria-activedescendant={items[active] ? `sr-${active}` : undefined}
            enterKeyHint="search"
            className="h-14 min-w-0 flex-1 bg-transparent text-base focus:outline-none"
          />
          {q && (
            <button type="button" onClick={() => { setQ(""); input.current?.focus(); }} className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary" aria-label="মুছুন">
              <X className="size-4" />
            </button>
          )}
          <button type="button" onClick={onClose} className="rounded-md border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary"><span className="sm:hidden">বাতিল</span><span className="hidden sm:inline">Esc</span></button>
        </div>

        <div ref={list} id="search-results" role="listbox" className="min-h-0 flex-1 overflow-y-auto p-2">
          {!q.trim() && (
            <div className="space-y-4 p-2">
              {recent.length > 0 && (
                <div>
                  <div className="mb-1 flex items-center justify-between px-1 text-xs font-semibold text-muted-foreground">
                    <span>সাম্প্রতিক সার্চ</span>
                    <button type="button" onClick={() => { clearRecent(); setRecent([]); }} className="hover:text-destructive">মুছে ফেলুন</button>
                  </div>
                  {recent.map((r) => {
                    idx++;
                    const i = idx;
                    return (
                      <button key={r} id={`sr-${i}`} data-idx={i} type="button" role="option" aria-selected={i === active} onMouseEnter={() => setActive(i)} onClick={() => setQ(r)} className={itemCls(i)}>
                        <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> <span className="text-sm">{r}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              <div>
                <p className="mb-2 flex items-center gap-1.5 px-1 text-xs font-semibold text-muted-foreground"><Sparkles className="size-3.5 text-accent" /> জনপ্রিয় বিষয়</p>
                <div className="flex flex-wrap gap-2 px-1">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} type="button" onClick={() => setQ(s)} className="rounded-full border px-3 py-1.5 text-sm hover:border-accent hover:text-primary">{s}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {q.trim() && data && (
            <>
              {data.shortcuts.length > 0 && (
                <div className="mb-2">
                  <p className="px-3 pb-1 pt-2 text-xs font-semibold text-muted-foreground">সরাসরি যান</p>
                  {data.shortcuts.map((s) => {
                    idx++;
                    const i = idx;
                    return (
                      <button key={s.href + s.title} id={`sr-${i}`} data-idx={i} type="button" role="option" aria-selected={i === active} onMouseEnter={() => setActive(i)} onClick={() => go(s.href)} className={itemCls(i)}>
                        <ArrowRight className="mt-0.5 size-4 shrink-0 text-accent" />
                        <span className="min-w-0"><span className="block text-sm font-semibold">{s.title}</span><span className="block text-xs text-muted-foreground">{s.hint}</span></span>
                      </button>
                    );
                  })}
                </div>
              )}
              {data.groups.filter((g) => g.hits.length).map((g) => {
                const Icon = ICON[g.type] ?? FileText;
                return (
                  <div key={g.type} className="mb-2">
                    <div className="flex items-center justify-between px-3 pb-1 pt-2 text-xs font-semibold text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Icon className="size-3.5 text-primary" />{g.label}</span>
                      <button type="button" onClick={() => go(`/search?q=${encodeURIComponent(q.trim())}&type=${g.type}`)} className="hover:text-primary">{toBnDigits(g.count)}টি · সব দেখুন</button>
                    </div>
                    {g.hits.map((h) => {
                      idx++;
                      const i = idx;
                      return (
                        <button key={`${h.href}-${i}`} id={`sr-${i}`} data-idx={i} type="button" role="option" aria-selected={i === active} onMouseEnter={() => setActive(i)} onClick={() => go(h.href)} className={itemCls(i)}>
                          <span className="min-w-0 flex-1">
                            <span className="line-clamp-1 block text-sm font-semibold"><Highlight text={h.title} q={q} /></span>
                            {h.snippet && <span className="line-clamp-2 block text-xs leading-relaxed text-muted-foreground"><Highlight text={h.snippet} q={q} /></span>}
                            {h.meta && <span className="mt-0.5 block text-[11px] text-primary/80">{h.meta}</span>}
                          </span>
                          {i === active && <CornerDownLeft className="mt-1 hidden size-3.5 shrink-0 text-muted-foreground sm:block" />}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
              {!hasResults && !loading && (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                  “{q}” — কিছু পাওয়া যায়নি। বানান পরিবর্তন করে বা ছোট শব্দে চেষ্টা করুন।
                </div>
              )}
              {(() => {
                idx++;
                const i = idx;
                return (
                  <button id={`sr-${i}`} data-idx={i} type="button" role="option" aria-selected={i === active} onMouseEnter={() => setActive(i)} onClick={() => go(`/search?q=${encodeURIComponent(q.trim())}`)} className={cn(itemCls(i), "mt-1 items-center justify-center border border-dashed font-semibold text-primary")}>
                    <Search className="size-4" /> “{q.trim()}” — সব ফলাফল দেখুন {data.total ? `(${toBnDigits(data.total)})` : ""}
                  </button>
                );
              })()}
            </>
          )}
          {q.trim() && !data && loading && <div className="space-y-2 p-2">{[0, 1, 2, 3].map((k) => <div key={k} className="h-14 animate-pulse rounded-xl bg-secondary/60" />)}</div>}
          {error && <p className="p-4 text-center text-sm text-destructive">সার্চ করা যায়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।</p>}
        </div>

        <div className="hidden items-center gap-4 border-t px-4 py-2 text-[11px] text-muted-foreground sm:flex">
          <span><kbd className="rounded border px-1">↑</kbd> <kbd className="rounded border px-1">↓</kbd> বাছাই</span>
          <span><kbd className="rounded border px-1">Enter</kbd> খুলুন</span>
          <span><kbd className="rounded border px-1">Esc</kbd> বন্ধ</span>
          <span className="ml-auto">আয়াতে যেতে লিখুন: ২:২৫৫</span>
        </div>
      </div>
    </div>
  );
}
