"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, FileText, Library, Loader2, MessageCircleQuestion, PlayCircle, ScrollText, Search, X } from "lucide-react";
import { addRecent, useLiveSearch, type Group, type Hit } from "./use-live-search";
import { Highlight } from "./highlight";
import { cn, toBnDigits } from "@/lib/utils";

const TYPES = [
  { v: "all", label: "সব", icon: Search },
  { v: "quran", label: "কুরআন", icon: BookOpen },
  { v: "hadith", label: "হাদীস", icon: ScrollText },
  { v: "qa", label: "প্রশ্নোত্তর", icon: MessageCircleQuestion },
  { v: "articles", label: "প্রবন্ধ", icon: FileText },
  { v: "lectures", label: "বয়ান", icon: PlayCircle },
  { v: "books", label: "বই", icon: Library },
] as const;
type T = (typeof TYPES)[number]["v"];
const PAGE = 10;

function HitItem({ h, q }: { h: Hit; q: string }) {
  return (
    <li>
      <Link href={h.href} onClick={() => addRecent(q)} className="group block px-5 py-4 hover:bg-secondary/40">
        <span className="block font-semibold leading-snug group-hover:text-primary"><Highlight text={h.title} q={q} /></span>
        {h.snippet && <span className="mt-1 block text-sm leading-relaxed text-muted-foreground"><Highlight text={h.snippet} q={q} /></span>}
        {h.meta && <span className="mt-1 block text-xs text-primary/80">{h.meta}</span>}
      </Link>
    </li>
  );
}

/** Live search page: results update as you type, with type tabs and "load more". */
export function SearchExperience({ initialQ, initialType }: { initialQ: string; initialType: string }) {
  const [q, setQ] = useState(initialQ);
  const [type, setType] = useState<T>((TYPES.find((t) => t.v === initialType)?.v ?? "all") as T);
  const [extra, setExtra] = useState<Hit[]>([]);
  const [moreLoading, setMoreLoading] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const { data, loading, error } = useLiveSearch(q, { limit: type === "all" ? 4 : PAGE, types: type === "all" ? undefined : [type], delay: 250 });
  // Counts for every tab always come from the "all" query.
  const { data: all } = useLiveSearch(q, { limit: 4, delay: 250 });

  useEffect(() => setExtra([]), [q, type]);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (q.trim()) url.searchParams.set("q", q.trim());
    else url.searchParams.delete("q");
    if (type !== "all") url.searchParams.set("type", type);
    else url.searchParams.delete("type");
    window.history.replaceState(null, "", url);
  }, [q, type]);

  const count = (t: T) => (t === "all" ? all?.total : all?.groups.find((g) => g.type === t)?.count) ?? 0;
  const group: Group | undefined = type === "all" ? undefined : data?.groups[0];

  async function loadMore() {
    if (!group) return;
    setMoreLoading(true);
    try {
      const params = new URLSearchParams({ q: q.trim(), type, limit: String(PAGE), offset: String(group.hits.length + extra.length) });
      const res = await fetch(`/api/search?${params}`);
      const json = await res.json();
      setExtra((x) => [...x, ...(json.groups?.[0]?.hits ?? [])]);
    } finally {
      setMoreLoading(false);
    }
  }

  return (
    <div>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          addRecent(q);
          input.current?.blur();
        }}
        className="flex items-center gap-2 rounded-full border bg-card p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-ring"
      >
        {loading ? <Loader2 className="ml-3 size-5 animate-spin text-primary" /> : <Search className="ml-3 size-5 text-muted-foreground" aria-hidden />}
        <input
          ref={input}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus={!initialQ}
          placeholder="কুরআন, হাদীস, প্রশ্নোত্তর বা প্রবন্ধে খুঁজুন… (যেমন: ২:২৫৫)"
          aria-label="অনুসন্ধান"
          className="h-11 min-w-0 flex-1 bg-transparent px-2 focus:outline-none"
        />
        {q && <button type="button" onClick={() => { setQ(""); input.current?.focus(); }} className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary" aria-label="মুছুন"><X className="size-4" /></button>}
      </form>

      <nav aria-label="ফলাফলের ধরন" className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4">
        {TYPES.map((t) => (
          <button key={t.v} type="button" onClick={() => setType(t.v)} aria-pressed={type === t.v} className={cn("inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm", type === t.v ? "border-primary bg-primary font-semibold text-white" : "bg-card hover:border-accent")}>
            <t.icon className="size-3.5" /> {t.label}
            {q.trim() && all && <span className={cn("rounded-full px-1.5 text-[11px]", type === t.v ? "bg-white/20" : "bg-secondary")}>{toBnDigits(count(t.v))}</span>}
          </button>
        ))}
      </nav>

      {error && <p className="mt-6 text-center text-sm text-destructive">সার্চ করা যায়নি। আবার চেষ্টা করুন।</p>}

      {!q.trim() && <p className="mt-10 text-center text-sm text-muted-foreground">কিছু লিখুন — লেখার সাথে সাথে ফলাফল দেখাবে।</p>}

      {q.trim() && data && type === "all" && (
        <div className="mt-6 space-y-8">
          {data.shortcuts.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {data.shortcuts.map((s) => (
                <Link key={s.href + s.title} href={s.href} className="flex items-center gap-3 rounded-xl border border-accent/50 bg-accent/10 px-4 py-3 hover:bg-accent/20">
                  <ArrowRight className="size-4 shrink-0 text-primary" />
                  <span><span className="block font-semibold">{s.title}</span><span className="text-xs text-muted-foreground">{s.hint}</span></span>
                </Link>
              ))}
            </div>
          )}
          {data.groups.filter((g) => g.hits.length).map((g) => (
            <section key={g.type}>
              <div className="mb-2 flex items-end justify-between border-b-2 border-accent/70 pb-2">
                <h2 className="text-lg font-bold text-primary">{g.label} <span className="text-sm font-normal text-muted-foreground">({toBnDigits(g.count)})</span></h2>
                {g.count > g.hits.length && <button type="button" onClick={() => setType(g.type as T)} className="text-sm font-semibold text-primary hover:underline">সব দেখুন →</button>}
              </div>
              <ul className="divide-y overflow-hidden rounded-xl border bg-card">{g.hits.map((h) => <HitItem key={h.href} h={h} q={q} />)}</ul>
            </section>
          ))}
        </div>
      )}

      {q.trim() && group && (
        <section className="mt-6">
          <p className="mb-2 text-sm text-muted-foreground">{toBnDigits(group.count)}টি ফলাফল</p>
          {group.hits.length ? (
            <ul className="divide-y overflow-hidden rounded-xl border bg-card">{[...group.hits, ...extra].map((h) => <HitItem key={h.href} h={h} q={q} />)}</ul>
          ) : null}
          {group.count > group.hits.length + extra.length && (
            <div className="mt-4 text-center">
              <button type="button" onClick={loadMore} disabled={moreLoading} className="inline-flex h-10 items-center gap-2 rounded-full border border-primary/30 px-5 text-sm font-semibold text-primary hover:bg-primary/5 disabled:opacity-60">
                {moreLoading && <Loader2 className="size-4 animate-spin" />} আরও দেখুন
              </button>
            </div>
          )}
        </section>
      )}

      {q.trim() && data && !loading && data.total === 0 && !data.shortcuts.length && (
        <div className="mt-10 rounded-xl border bg-card px-6 py-12 text-center">
          <p className="text-muted-foreground">“{q}” — কিছু পাওয়া যায়নি। অন্য শব্দে খুঁজুন, অথবা সরাসরি প্রশ্ন করুন।</p>
          <Link href="/ask" className="mt-4 inline-block rounded-full bg-accent px-5 py-2 text-sm font-semibold text-brand-deep">প্রশ্ন করুন</Link>
        </div>
      )}
      {q.trim() && !data && loading && <div className="mt-6 space-y-3">{[0, 1, 2].map((k) => <div key={k} className="h-20 animate-pulse rounded-xl bg-secondary/60" />)}</div>}
    </div>
  );
}
