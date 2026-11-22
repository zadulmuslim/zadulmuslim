"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { printSection } from "@/lib/print-section";
import { ChevronLeft, ChevronRight, Clock, LocateFixed, MapPin, Moon, Printer, Sun, Sunrise, Sunset } from "lucide-react";
import { DISTRICTS, type District } from "@/data/districts";
import { bnDate, computeDay, dhakaYmd, forbiddenTimes, formatDuration, formatTime, hijriDate, PRAYER_LABEL, waqts, type DayTimes } from "@/lib/prayer";
import { cn, toBnDigits } from "@/lib/utils";

const STORE = "zm-district";
const ICON = { fajr: Moon, dhuhr: Sun, asr: Sun, maghrib: Sunset, isha: Moon } as const;
const DIVISIONS = [...new Set(DISTRICTS.map((d) => d.division))];

function nearest(lat: number, lng: number): District {
  let best = DISTRICTS[0]!;
  let bestD = Infinity;
  for (const d of DISTRICTS) {
    const dist = (d.lat - lat) ** 2 + ((d.lng - lng) * Math.cos((lat * Math.PI) / 180)) ** 2;
    if (dist < bestD) {
      bestD = dist;
      best = d;
    }
  }
  return best;
}

const ymdAdd = ([y, m, d]: [number, number, number], days: number): [number, number, number] => {
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()];
};

export function PrayerTimesTool({ initialSlug }: { initialSlug?: string }) {
  const monthRef = useRef<HTMLElement>(null);
  const [district, setDistrict] = useState<District>(() => DISTRICTS.find((d) => d.slug === (initialSlug ?? "dhaka")) ?? DISTRICTS.find((d) => d.slug === "dhaka")!);
  const [now, setNow] = useState<Date | null>(null);
  const [offset, setOffset] = useState(0);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    if (!initialSlug) {
      try {
        const saved = localStorage.getItem(STORE);
        const found = saved && DISTRICTS.find((d) => d.slug === saved);
        if (found) setDistrict(found);
      } catch {}
    }
    return () => clearInterval(t);
  }, [initialSlug]);

  function choose(d: District) {
    setDistrict(d);
    try {
      localStorage.setItem(STORE, d.slug);
    } catch {}
    const url = new URL(window.location.href);
    url.searchParams.set("district", d.slug);
    window.history.replaceState(null, "", url);
  }

  function locate() {
    if (!navigator.geolocation) return setLocError("এই ব্রাউজারে অবস্থান জানা সম্ভব নয়।");
    setLocating(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        choose(nearest(p.coords.latitude, p.coords.longitude));
      },
      () => {
        setLocating(false);
        setLocError("অবস্থান পাওয়া যায়নি। তালিকা থেকে জেলা বেছে নিন।");
      },
      { timeout: 10000, maximumAge: 600000 },
    );
  }

  const today = now ? dhakaYmd(now) : null;
  const shown = today ? ymdAdd(today, offset) : null;
  const day: DayTimes | null = useMemo(() => (shown ? computeDay(district.lat, district.lng, ...shown) : null), [district, shown?.[0], shown?.[1], shown?.[2]]); // eslint-disable-line react-hooks/exhaustive-deps
  const todayTimes = useMemo(() => (today ? computeDay(district.lat, district.lng, ...today) : null), [district, today?.[0], today?.[1], today?.[2]]); // eslint-disable-line react-hooks/exhaustive-deps

  // Current and next prayer (based on today, regardless of the date being browsed).
  const status = useMemo(() => {
    if (!now || !todayTimes) return null;
    const list = waqts(todayTimes);
    let current = list.find((w) => now >= w.start && now <= w.end) ?? null;
    // After midnight and before Fajr, the previous night's Isha waqt is still running.
    if (!current && now < todayTimes.fajr && today) {
      const y = computeDay(district.lat, district.lng, ...ymdAdd(today, -1));
      if (now >= y.isha) current = { key: "isha" as const, start: y.isha, end: todayTimes.fajr };
    }
    const upcoming = list.find((w) => w.start > now) ?? { key: "fajr" as const, start: todayTimes.nextFajr, end: todayTimes.nextFajr };
    return { current, upcoming };
  }, [now, todayTimes]); // eslint-disable-line react-hooks/exhaustive-deps

  const month = useMemo(() => {
    if (!shown) return [];
    const [y, m] = shown;
    const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return Array.from({ length: days }, (_, i) => computeDay(district.lat, district.lng, y, m, i + 1));
  }, [district, shown?.[0], shown?.[1]]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      {/* Location bar */}
      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center">
        <label className="flex min-w-0 flex-1 items-center gap-2">
          <MapPin className="size-5 shrink-0 text-primary" aria-hidden />
          <span className="sr-only">জেলা</span>
          <select
            value={district.slug}
            onChange={(e) => choose(DISTRICTS.find((d) => d.slug === e.target.value)!)}
            className="h-11 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {DIVISIONS.map((div) => (
              <optgroup key={div} label={`${div} বিভাগ`}>
                {DISTRICTS.filter((d) => d.division === div).map((d) => (
                  <option key={d.slug} value={d.slug}>{d.bn}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <button type="button" onClick={locate} disabled={locating} className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-primary/30 px-4 text-sm font-semibold text-primary hover:bg-primary/5 disabled:opacity-60">
          <LocateFixed className={cn("size-4", locating && "animate-pulse")} /> {locating ? "খোঁজা হচ্ছে…" : "আমার অবস্থান"}
        </button>
      </div>
      {locError && <p className="-mt-3 text-sm text-destructive">{locError}</p>}

      {/* Now / next */}
      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-deep to-primary p-6 text-white shadow-md">
          <span aria-hidden className="pointer-events-none absolute -right-6 -top-10 text-[160px] leading-none text-white/5">☪</span>
          {now && status && todayTimes ? (
            <>
              <p className="text-sm text-white/75">{bnDate(now)} · {hijriDate(now)}</p>
              <p className="mt-1 text-sm text-accent">{district.bn} · এখন {formatTime(now)}</p>
              <div className="mt-5">
                <p className="text-sm text-white/80">{status.current ? `চলছে ${PRAYER_LABEL[status.current.key]}-এর ওয়াক্ত` : "এখন কোনো ফরয নামাযের ওয়াক্ত নয়"}</p>
                <p className="mt-3 text-sm text-white/80">পরবর্তী নামায</p>
                <p className="text-3xl font-bold">{PRAYER_LABEL[status.upcoming.key]} · {formatTime(status.upcoming.start)}</p>
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm" aria-live="off">
                  <Clock className="size-4 text-accent" /> বাকি {formatDuration(status.upcoming.start.getTime() - now.getTime())}
                </p>
              </div>
            </>
          ) : (
            <div className="h-44 animate-pulse rounded-xl bg-white/10" />
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "সাহরির শেষ সময়", value: todayTimes?.fajr, icon: Moon },
            { label: "ইফতার", value: todayTimes?.maghrib, icon: Sunset },
            { label: "সূর্যোদয়", value: todayTimes?.sunrise, icon: Sunrise },
            { label: "সূর্যাস্ত", value: todayTimes?.maghrib, icon: Sunset },
          ].map((c) => (
            <div key={c.label} className="rounded-2xl border bg-card p-4 shadow-sm">
              <c.icon className="size-5 text-accent" aria-hidden />
              <p className="mt-2 text-xs text-muted-foreground">{c.label}</p>
              <p className="text-lg font-bold text-primary">{c.value ? formatTime(c.value) : "—"}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Day table */}
      <section className="rounded-2xl border bg-card shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <button type="button" onClick={() => setOffset((o) => o - 1)} className="grid size-9 place-items-center rounded-full hover:bg-secondary" aria-label="আগের দিন"><ChevronLeft className="size-5" /></button>
          <div className="text-center">
            <h2 className="font-bold text-primary">{day ? bnDate(day.date) : "…"}</h2>
            <p className="text-xs text-muted-foreground">{day ? hijriDate(day.date) : ""}{offset !== 0 && (
              <button type="button" onClick={() => setOffset(0)} className="ml-2 font-semibold text-primary underline">আজ</button>
            )}</p>
          </div>
          <button type="button" onClick={() => setOffset((o) => o + 1)} className="grid size-9 place-items-center rounded-full hover:bg-secondary" aria-label="পরের দিন"><ChevronRight className="size-5" /></button>
        </div>
        <ul className="divide-y">
          {day &&
            waqts(day).map((w) => {
              const Icon = ICON[w.key];
              const active = offset === 0 && status?.current?.key === w.key && !(w.key === "isha" && now && now < day.fajr);
              return (
                <li key={w.key} className={cn("flex items-center gap-3 px-4 py-3.5", active && "bg-primary/5")}>
                  <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", active ? "bg-primary text-white" : "bg-secondary text-primary")}>
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">
                      {PRAYER_LABEL[w.key]} {active && <span className="ml-1 rounded-full bg-accent px-2 py-0.5 text-[11px] text-brand-deep">চলছে</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      শেষ: {formatTime(w.end)}
                      {w.key === "asr" && <> · শাফেয়ী মতে শুরু {formatTime(day.asrShafi, false)}</>}
                      {w.key === "isha" && <> · উত্তম: মধ্যরাতের ({formatTime(day.midnight, false)}) আগে</>}
                    </p>
                  </div>
                  <p className="text-lg font-bold tabular-nums text-primary">{formatTime(w.start, false)}</p>
                </li>
              );
            })}
        </ul>
        {day && (
          <div className="border-t bg-secondary/30 px-4 py-3 text-xs text-muted-foreground">
            <p className="mb-1 font-semibold text-foreground">নামায নিষিদ্ধ সময় (আনুমানিক)</p>
            <ul className="space-y-0.5">
              {forbiddenTimes(day).map((f) => (
                <li key={f.label}>{f.label}: {formatTime(f.start, false)} – {formatTime(f.end, false)}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Month */}
      <section ref={monthRef} className="rounded-2xl border bg-card shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <h2 className="font-bold text-primary">{shown ? `${bnDate(new Date(Date.UTC(shown[0], shown[1] - 1, 15)), { month: "long", year: "numeric" })}-এর সময়সূচি` : "মাসিক সময়সূচি"} — {district.bn}</h2>
          <button type="button" onClick={() => printSection(monthRef.current, `নামাজের সময়সূচি — ${district.bn}`)} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold hover:border-accent print:hidden">
            <Printer className="size-3.5" /> প্রিন্ট / PDF
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-secondary/50 text-xs text-muted-foreground">
              <tr>
                {["তারিখ", "ফজর", "সূর্যোদয়", "যোহর", "আসর", "মাগরিব", "ইশা"].map((h) => (
                  <th key={h} scope="col" className="px-3 py-2 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {month.map((d) => {
                const isToday = today && dhakaYmd(d.date).join() === today.join();
                return (
                  <tr key={d.date.toISOString()} className={cn("tabular-nums", isToday && "bg-primary/5 font-semibold")}>
                    <td className="px-3 py-2">{bnDate(d.date, { day: "numeric", weekday: "short" })}</td>
                    {[d.fajr, d.sunrise, d.dhuhr, d.asr, d.maghrib, d.isha].map((t, i) => (
                      <td key={i} className="px-3 py-2">{formatTime(t, false)}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <p className="rounded-xl border border-dashed bg-card px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        হিসাব পদ্ধতি: ইউনিভার্সিটি অব ইসলামিক সায়েন্সেস, করাচি (ফজর ও ইশা ১৮°), আসর হানাফী মাযহাব অনুযায়ী — বাংলাদেশে প্রচলিত পদ্ধতি। জেলা সদরের অবস্থান ধরে হিসাব করা; এলাকা ও স্থানীয় মসজিদের সময়সূচির সাথে {toBnDigits(1)}–{toBnDigits(3)} মিনিট পার্থক্য হতে পারে। সতর্কতার জন্য ওয়াক্ত শুরুর কয়েক মিনিট পরে নামায আদায় করুন।
      </p>
    </div>
  );
}
