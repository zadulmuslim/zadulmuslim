"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { cn, toBnDigits } from "@/lib/utils";

interface S { number: number; name_ar: string; name_bn: string; name_translit: string; meaning_bn: string; revelation: "meccan" | "medinan"; ayah_count: number }

const norm = (s: string) => s.toLowerCase().replace(/[০-৯]/g, (d) => String(d.charCodeAt(0) - 0x09e6)).replace(/[-'’\s]/g, "");

export function SurahList({ surahs }: { surahs: S[] }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<"all" | "meccan" | "medinan">("all");
  const list = useMemo(() => {
    const n = norm(q);
    return surahs.filter((s) => (type === "all" || s.revelation === type) && (!n || String(s.number) === n || norm(`${s.name_bn}${s.name_translit}${s.meaning_bn}${s.name_ar}`).includes(n)));
  }, [q, type, surahs]);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex h-11 flex-1 items-center gap-2 rounded-full border bg-card px-4 focus-within:ring-2 focus-within:ring-ring">
          <Search className="size-4 text-muted-foreground" aria-hidden />
          <span className="sr-only">সূরা খুঁজুন</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="সূরার নাম বা নম্বর লিখুন…" className="h-full min-w-0 flex-1 bg-transparent text-sm focus:outline-none" />
        </label>
        <div className="flex gap-1.5" role="group" aria-label="অবতরণস্থল">
          {([["all", "সব"], ["meccan", "মাক্কী"], ["medinan", "মাদানী"]] as const).map(([v, l]) => (
            <button key={v} type="button" onClick={() => setType(v)} aria-pressed={type === v} className={cn("h-10 rounded-full border px-4 text-sm", type === v ? "border-primary bg-primary text-white" : "bg-card hover:border-accent")}>{l}</button>
          ))}
        </div>
      </div>
      {list.length === 0 ? (
        <p className="rounded-xl border bg-card px-4 py-10 text-center text-sm text-muted-foreground">এই নামে কোনো সূরা পাওয়া যায়নি।</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => (
            <li key={s.number}>
              <Link href={`/quran/${s.number}`} className="group flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm transition hover:border-accent hover:shadow-md">
                <span className="grid size-11 shrink-0 rotate-45 place-items-center rounded-lg border-2 border-accent/60 bg-secondary/60 transition group-hover:bg-primary">
                  <span className="-rotate-45 text-sm font-bold text-primary group-hover:text-white">{toBnDigits(s.number)}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold group-hover:text-primary">{s.name_bn}</span>
                  <span className="block truncate text-xs text-muted-foreground">{s.meaning_bn} · {toBnDigits(s.ayah_count)} আয়াত · {s.revelation === "meccan" ? "মাক্কী" : "মাদানী"}</span>
                </span>
                <span lang="ar" dir="rtl" className="font-quran shrink-0 text-xl text-primary">{s.name_ar}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
