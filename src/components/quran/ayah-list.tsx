"use client";
import { useEffect, useState } from "react";
import { Check, Copy, Link2, Loader2, NotebookText, Settings2 } from "lucide-react";
import { toBnDigits } from "@/lib/utils";

interface A { ayah: number; juz: number | null; text_ar: string; text_bn: string | null; has_notes: boolean }

const PREFS = "zm-quran-prefs";
const arNum = (n: number) => n.toLocaleString("ar-EG", { useGrouping: false });

/** Footnotes arrive as plain text with <b> and line breaks; everything else is escaped. */
function NotesBody({ text }: { text: string }) {
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = escape(text)
    .replace(/&lt;b&gt;/g, "<strong>")
    .replace(/&lt;\/b&gt;/g, "</strong>")
    .split(/\n\s*\n/)
    .map((p) => `<p>${p.trim().replace(/\n/g, "<br>")}</p>`)
    .join("");
  return <div className="space-y-2 text-sm leading-relaxed [&_strong]:text-primary" dangerouslySetInnerHTML={{ __html: html }} />;
}

function AyahItem({ surah, a, showBn, size, juzStart }: { surah: number; a: A; showBn: boolean; size: number; juzStart: boolean }) {
  const [notes, setNotes] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<"text" | "link" | null>(null);

  async function toggleNotes() {
    if (open) return setOpen(false);
    setOpen(true);
    if (notes !== null) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/quran/notes?s=${surah}&a=${a.ayah}`);
      setNotes((await res.json()).notes ?? "");
    } catch {
      setNotes("");
    }
    setLoading(false);
  }

  async function copy(kind: "text" | "link") {
    const url = `${window.location.origin}/quran/${surah}#a-${a.ayah}`;
    const text = kind === "link" ? url : `${a.text_ar}\n\n${a.text_bn ?? ""}\n\n— সূরা ${toBnDigits(surah)}, আয়াত ${toBnDigits(a.ayah)}\n${url}`;
    try {
      if (kind === "link" && navigator.share) await navigator.share({ url, title: `কুরআন ${surah}:${a.ayah}` });
      else await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  }

  return (
    <li id={`a-${a.ayah}`} className="scroll-mt-24">
      {juzStart && a.juz && (
        <p className="my-4 flex items-center gap-3 text-xs font-semibold">
          <span className="h-px flex-1 bg-accent/50" />
          <span className="rounded-full bg-accent/15 px-3 py-1 text-primary">পারা {toBnDigits(a.juz)} শুরু</span>
          <span className="h-px flex-1 bg-accent/50" />
        </p>
      )}
      <div className="rounded-2xl border bg-card p-4 shadow-sm target:ring-2 target:ring-accent sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <a href={`#a-${a.ayah}`} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-primary">{toBnDigits(surah)}:{toBnDigits(a.ayah)}</a>
          <div className="flex items-center gap-0.5">
            <button type="button" onClick={() => copy("text")} className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-primary" aria-label="আয়াত কপি করুন" title="আয়াত কপি করুন">
              {copied === "text" ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
            </button>
            <button type="button" onClick={() => copy("link")} className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-primary" aria-label="লিংক শেয়ার করুন" title="লিংক শেয়ার করুন">
              {copied === "link" ? <Check className="size-4 text-primary" /> : <Link2 className="size-4" />}
            </button>
          </div>
        </div>
        <p lang="ar" dir="rtl" className="font-quran leading-[2.3] text-foreground" style={{ fontSize: `${size}px` }}>
          {a.text_ar}{" "}
          <span className="inline-block text-[0.8em] text-accent">﴿{arNum(a.ayah)}﴾</span>
        </p>
        {showBn && a.text_bn && <p className="mt-3 border-t border-dashed pt-3 leading-relaxed text-foreground/90">{a.text_bn}</p>}
        {showBn && a.has_notes && (
          <div className="mt-3">
            <button type="button" onClick={toggleNotes} aria-expanded={open} className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/5">
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : <NotebookText className="size-3.5" />}
              {open ? "টীকা বন্ধ করুন" : "টীকা ও ব্যাখ্যা"}
            </button>
            {open && !loading && (
              <div className="mt-3 rounded-xl bg-secondary/40 p-4">
                {notes ? <NotesBody text={notes} /> : <p className="text-sm text-muted-foreground">টীকা লোড করা যায়নি।</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export function AyahList({ surah, ayahs }: { surah: number; ayahs: A[] }) {
  const [showBn, setShowBn] = useState(true);
  const [size, setSize] = useState(28);
  const [panel, setPanel] = useState(false);

  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem(PREFS) ?? "{}");
      if (typeof p.showBn === "boolean") setShowBn(p.showBn);
      if (typeof p.size === "number") setSize(p.size);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(PREFS, JSON.stringify({ showBn, size }));
    } catch {}
  }, [showBn, size]);

  return (
    <div>
      <div className="sticky top-16 z-20 mb-4 flex justify-end">
        <div className="relative">
          <button type="button" onClick={() => setPanel((p) => !p)} aria-expanded={panel} className="inline-flex items-center gap-1.5 rounded-full border bg-card/95 px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur hover:border-accent">
            <Settings2 className="size-4 text-primary" /> পড়ার সেটিং
          </button>
          {panel && (
            <div className="absolute right-0 top-10 w-64 space-y-4 rounded-xl border bg-card p-4 shadow-lg">
              <label className="flex items-center justify-between gap-3 text-sm">
                বাংলা অনুবাদ দেখান
                <input type="checkbox" checked={showBn} onChange={(e) => setShowBn(e.target.checked)} className="size-4 accent-[var(--primary)]" />
              </label>
              <label className="block text-sm">
                আরবি লেখার আকার: {toBnDigits(size)}
                <input type="range" min={20} max={44} step={2} value={size} onChange={(e) => setSize(+e.target.value)} className="mt-2 w-full accent-[var(--primary)]" />
              </label>
            </div>
          )}
        </div>
      </div>
      <ol className="space-y-4">
        {ayahs.map((a, i) => (
          <AyahItem key={a.ayah} surah={surah} a={a} showBn={showBn} size={size} juzStart={i > 0 && a.juz !== ayahs[i - 1]?.juz} />
        ))}
      </ol>
    </div>
  );
}

