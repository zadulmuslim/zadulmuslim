"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toBnDigits } from "@/lib/utils";

/** Jump to another surah, or to an ayah within this one. */
export function SurahJump({ current, surahs, ayahCount }: { current: number; surahs: { number: number; name_bn: string }[]; ayahCount: number }) {
  const router = useRouter();
  const [ayah, setAyah] = useState("");
  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      <label className="min-w-0 flex-1">
        <span className="sr-only">সূরা বেছে নিন</span>
        <select value={current} onChange={(e) => router.push(`/quran/${e.target.value}`)} className="h-10 w-full rounded-full border bg-card px-4 text-sm">
          {surahs.map((s) => (
            <option key={s.number} value={s.number}>{toBnDigits(s.number)}. {s.name_bn}</option>
          ))}
        </select>
      </label>
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const n = Number(ayah.replace(/[০-৯]/g, (d) => String(d.charCodeAt(0) - 0x09e6)));
          if (n >= 1 && n <= ayahCount) {
            const el = document.getElementById(`a-${n}`);
            window.history.replaceState(null, "", `#a-${n}`);
            el?.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }}
      >
        <label>
          <span className="sr-only">আয়াত নম্বর</span>
          <input value={ayah} onChange={(e) => setAyah(e.target.value)} inputMode="numeric" placeholder={`আয়াত (১–${toBnDigits(ayahCount)})`} className="h-10 w-32 rounded-full border bg-card px-4 text-sm" />
        </label>
        <button type="submit" className="h-10 rounded-full bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90">যান</button>
      </form>
    </div>
  );
}
