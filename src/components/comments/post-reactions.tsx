"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useViewer } from "@/components/layout/viewer";
import { useDialog } from "@/components/ui/dialogs";
import { cn, toBnDigits } from "@/lib/utils";

type TargetType = "question" | "article" | "hadith" | "lecture";
type Reaction = "like" | "love" | "care" | "wow" | "sad" | "dua";
type Counts = Partial<Record<Reaction, number>>;

const REACTIONS: { kind: Reaction; emoji: string; label: string; color: string }[] = [
  { kind: "like", emoji: "👍", label: "লাইক", color: "text-blue-600" },
  { kind: "love", emoji: "❤️", label: "ভালোবাসা", color: "text-rose-600" },
  { kind: "care", emoji: "🤗", label: "পাশে আছি", color: "text-amber-600" },
  { kind: "wow", emoji: "😮", label: "বিস্ময়", color: "text-amber-600" },
  { kind: "sad", emoji: "😢", label: "দুঃখিত", color: "text-amber-600" },
  { kind: "dua", emoji: "🤲", label: "আমীন", color: "text-primary" },
];
const R = Object.fromEntries(REACTIONS.map((r) => [r.kind, r])) as Record<Reaction, (typeof REACTIONS)[number]>;

/** Facebook-style reactions for a whole post. Updates instantly; the server is told in the background. */
export function PostReactions({ type, id }: { type: TargetType; id: string | number }) {
  const targetId = String(id);
  const viewer = useViewer();
  const dialog = useDialog();
  const pathname = usePathname();
  const [counts, setCounts] = useState<Counts>({});
  const [mine, setMine] = useState<Reaction | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [pop, setPop] = useState(false);
  const seq = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);
  const wrap = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/reactions?type=${type}&id=${encodeURIComponent(targetId)}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setCounts(data.counts ?? {});
      setMine(data.mine ?? null);
    } finally {
      setReady(true);
    }
  }, [type, targetId]);

  useEffect(() => {
    if (viewer.status !== "loading") void load();
  }, [viewer.status, load]);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const pick = async (kind: Reaction | null) => {
    setOpen(false);
    if (viewer.status !== "signed-in") {
      if (await dialog.confirm({ title: "লগইন প্রয়োজন", message: "প্রতিক্রিয়া জানাতে লগইন করুন।", confirmText: "লগইন করুন" })) {
        window.location.href = `/login?next=${encodeURIComponent(pathname)}`;
      }
      return;
    }
    // Optimistic update.
    const prev = mine;
    setCounts((c) => {
      const n = { ...c };
      if (prev) n[prev] = Math.max(0, (n[prev] ?? 1) - 1);
      if (kind) n[kind] = (n[kind] ?? 0) + 1;
      return n;
    });
    setMine(kind);
    if (kind) { setPop(true); setTimeout(() => setPop(false), 300); }

    const my = ++seq.current;
    try {
      const res = await fetch("/api/reactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, id: targetId, kind }) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error);
    } catch (e) {
      if (my === seq.current) {
        void load(); // resync with the server's truth
        void dialog.alert({ title: "সম্ভব হয়নি", message: e instanceof Error && e.message ? e.message : "আবার চেষ্টা করুন।" });
      }
    }
  };

  const clear = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; };
  const total = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);
  const top = (Object.entries(counts) as [Reaction, number][]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
  const meta = mine ? R[mine] : null;
  const summary = !total ? null : mine ? (total === 1 ? "আপনি" : `আপনি ও আরও ${toBnDigits(total - 1)} জন`) : `${toBnDigits(total)} জন`;

  return (
    <div className="mt-6 rounded-2xl border bg-card">
      {total > 0 && (
        <div className="flex items-center justify-between gap-2 border-b px-4 py-2 text-sm text-muted-foreground">
          <span
            className="flex items-center gap-1.5"
            title={(Object.entries(counts) as [Reaction, number][]).filter(([, n]) => n > 0).map(([k, n]) => `${R[k].label} ${toBnDigits(n)}`).join(" · ")}
          >
            <span className="flex -space-x-0.5">
              {top.map((k) => <span key={k} className="grid size-5 place-items-center rounded-full bg-card text-[13px] ring-2 ring-card">{R[k].emoji}</span>)}
            </span>
            {summary}
          </span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-1 p-1">
        <div
          ref={wrap}
          className="relative"
          onMouseEnter={() => { clear(); timer.current = setTimeout(() => setOpen(true), 300); }}
          onMouseLeave={() => { clear(); timer.current = setTimeout(() => setOpen(false), 250); }}
        >
          {open && (
            <div role="toolbar" aria-label="প্রতিক্রিয়া" className="absolute bottom-full left-0 z-30 mb-1 flex gap-0.5 rounded-full bg-card p-1 shadow-lg ring-1 ring-border">
              {REACTIONS.map((r) => (
                <button
                  key={r.kind}
                  type="button"
                  title={r.label}
                  aria-label={r.label}
                  onClick={() => void pick(mine === r.kind ? null : r.kind)}
                  className={cn("grid size-10 place-items-center rounded-full text-2xl transition-transform duration-100 hover:-translate-y-1 hover:scale-125", mine === r.kind && "bg-primary/10")}
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            disabled={!ready}
            aria-pressed={Boolean(mine)}
            className={cn("flex w-full select-none items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted disabled:opacity-60", meta?.color)}
            onTouchStart={() => { longPressed.current = false; clear(); timer.current = setTimeout(() => { longPressed.current = true; setOpen(true); }, 350); }}
            onTouchEnd={clear}
            onTouchMove={clear}
            onContextMenu={(e) => e.preventDefault()}
            onClick={() => {
              if (longPressed.current) { longPressed.current = false; return; }
              clear();
              void pick(mine ? null : "like");
            }}
          >
            <span className={cn("text-lg leading-none transition-transform", pop && "scale-125")}>{meta ? meta.emoji : "👍"}</span>
            {meta ? meta.label : "লাইক"}
          </button>
        </div>
        <a href="#comments" className="flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" /></svg>
          মন্তব্য
        </a>
      </div>
    </div>
  );
}
