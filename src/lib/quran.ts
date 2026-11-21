import "server-only";
import { cache } from "react";
import { publicDb } from "@/lib/supabase/public";

export interface Surah {
  number: number;
  name_ar: string;
  name_bn: string;
  name_translit: string;
  meaning_bn: string;
  revelation: "meccan" | "medinan";
  ayah_count: number;
}

export interface Ayah {
  ayah: number;
  juz: number | null;
  text_ar: string;
  text_bn: string | null;
  has_notes: boolean;
}

export const getSurahs = cache(async (): Promise<Surah[]> => {
  const db = publicDb();
  if (!db) return [];
  const { data } = await db.from("quran_surahs").select("number, name_ar, name_bn, name_translit, meaning_bn, revelation, ayah_count").order("number");
  return (data ?? []) as Surah[];
});

export async function getSurahWithAyahs(n: number): Promise<{ surah: Surah; ayahs: Ayah[] } | null> {
  const db = publicDb();
  if (!db) return null;
  const surahs = await getSurahs();
  const surah = surahs.find((s) => s.number === n);
  if (!surah) return null;
  // Footnotes can be long; they are loaded on demand, so only a flag is fetched here.
  const { data } = await db.from("quran_ayahs").select("ayah, juz, text_ar, text_bn, has_notes").eq("surah", n).order("ayah").limit(300);
  const ayahs = (data ?? []) as Ayah[];
  return { surah, ayahs };
}

export async function getFootnotes(surah: number, ayah: number): Promise<string | null> {
  const db = publicDb();
  if (!db) return null;
  const { data } = await db.from("quran_ayahs").select("footnotes_bn").eq("surah", surah).eq("ayah", ayah).maybeSingle();
  return data?.footnotes_bn ?? null;
}

export const getSources = cache(async () => {
  const db = publicDb();
  if (!db) return [];
  const { data } = await db.from("content_sources").select("key, title_bn, attribution, url, license, version").order("key");
  return data ?? [];
});

/** Arabic-Indic numerals for ayah markers. */
export const arabicNum = (n: number) => n.toLocaleString("ar-EG", { useGrouping: false });

/**
 * Tanzil's text includes the Basmala at the start of each surah's first ayah.
 * For display it is shown once as the surah heading (the stored text is unchanged).
 */
export function splitBasmala(surah: number, ayah: number, text: string, basmala: string): string {
  if (surah === 1 || surah === 9 || ayah !== 1) return text;
  return text.startsWith(basmala) ? text.slice(basmala.length).trimStart() : text;
}
