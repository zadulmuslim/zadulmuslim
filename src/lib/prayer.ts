import { CalculationMethod, Coordinates, Madhab, PrayerTimes, SunnahTimes } from "adhan";
import { toBnDigits } from "@/lib/utils";

/**
 * Prayer times for Bangladesh: University of Islamic Sciences, Karachi
 * (Fajr 18°, Isha 18°) with Hanafi Asr — the convention used by the
 * Islamic Foundation Bangladesh. All times are shown in Asia/Dhaka.
 */
export const TZ = "Asia/Dhaka";

export type PrayerKey = "fajr" | "sunrise" | "dhuhr" | "asr" | "maghrib" | "isha";

export const PRAYER_LABEL: Record<PrayerKey, string> = {
  fajr: "ফজর",
  sunrise: "সূর্যোদয়",
  dhuhr: "যোহর",
  asr: "আসর",
  maghrib: "মাগরিব",
  isha: "ইশা",
};

export interface DayTimes {
  date: Date;
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  asrShafi: Date;
  maghrib: Date;
  isha: Date;
  midnight: Date;
  nextFajr: Date;
}

/** Calendar date (y, m, d) as it is in Bangladesh for a given instant. */
export function dhakaYmd(d: Date): [number, number, number] {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d).split("-");
  return [Number(parts[0]), Number(parts[1]), Number(parts[2])];
}

export function computeDay(lat: number, lng: number, y: number, m: number, d: number): DayTimes {
  const coords = new Coordinates(lat, lng);
  const params = CalculationMethod.Karachi();
  params.madhab = Madhab.Hanafi;
  // adhan uses the date's calendar day; noon UTC avoids any timezone edge.
  const date = new Date(Date.UTC(y, m - 1, d, 6));
  const t = new PrayerTimes(coords, date, params);
  const shafiParams = CalculationMethod.Karachi();
  shafiParams.madhab = Madhab.Shafi;
  const shafi = new PrayerTimes(coords, date, shafiParams);
  const next = new PrayerTimes(coords, new Date(Date.UTC(y, m - 1, d + 1, 6)), params);
  return {
    date,
    fajr: t.fajr,
    sunrise: t.sunrise,
    dhuhr: t.dhuhr,
    asr: t.asr,
    asrShafi: shafi.asr,
    maghrib: t.maghrib,
    isha: t.isha,
    midnight: new SunnahTimes(t).middleOfTheNight,
    nextFajr: next.fajr,
  };
}

const addMin = (d: Date, min: number) => new Date(d.getTime() + min * 60_000);

/** Start and end of each waqt, plus the makruh (forbidden) windows. */
export function waqts(t: DayTimes) {
  return [
    { key: "fajr" as const, start: t.fajr, end: addMin(t.sunrise, -1) },
    { key: "dhuhr" as const, start: t.dhuhr, end: addMin(t.asr, -1) },
    { key: "asr" as const, start: t.asr, end: addMin(t.maghrib, -1) },
    { key: "maghrib" as const, start: t.maghrib, end: addMin(t.isha, -1) },
    { key: "isha" as const, start: t.isha, end: addMin(t.nextFajr, -1) },
  ];
}

export function forbiddenTimes(t: DayTimes) {
  return [
    { label: "সূর্যোদয়ের সময়", start: t.sunrise, end: addMin(t.sunrise, 15) },
    { label: "ঠিক দুপুর (যাওয়াল)", start: addMin(t.dhuhr, -6), end: addMin(t.dhuhr, -1) },
    { label: "সূর্যাস্তের সময়", start: addMin(t.maghrib, -15), end: t.maghrib },
  ];
}

function dayPart(h: number): string {
  if (h < 4) return "রাত";
  if (h < 6) return "ভোর";
  if (h < 12) return "সকাল";
  if (h < 15) return "দুপুর";
  if (h < 18) return "বিকাল";
  if (h < 20) return "সন্ধ্যা";
  return "রাত";
}

/** "ভোর ৪:৫৮" style time in Bangladesh time. */
export function formatTime(d: Date, withPart = true): string {
  const [h, m] = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d).split(":").map(Number) as [number, number];
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const text = `${toBnDigits(h12)}:${toBnDigits(String(m).padStart(2, "0"))}`;
  return withPart ? `${dayPart(h)} ${text}` : text;
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h ? `${toBnDigits(h)} ঘণ্টা ` : ""}${toBnDigits(m)} মিনিট ${toBnDigits(String(s).padStart(2, "0"))} সেকেন্ড`;
}

export function bnDate(d: Date, opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long", year: "numeric" }) {
  return new Intl.DateTimeFormat("bn-BD", { timeZone: TZ, ...opts }).format(d);
}

export function hijriDate(d: Date) {
  try {
    return new Intl.DateTimeFormat("bn-BD-u-ca-islamic-umalqura", { timeZone: TZ, day: "numeric", month: "long", year: "numeric" })
      .format(d)
      .replace(/\s*যুগ\s*/g, "")
      .trim() + " হিজরি";
  } catch {
    return "";
  }
}
