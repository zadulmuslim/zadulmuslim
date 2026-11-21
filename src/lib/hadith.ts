import "server-only";
import { cache } from "react";
import { publicDb } from "@/lib/supabase/public";

export interface HadithCategory { id: number; title_bn: string; parent_id: number | null; hadeeths_count: number }
export interface HadithSummary { id: number; title_bn: string; grade_bn: string | null; attribution_bn: string | null }
export interface Hadith extends HadithSummary {
  hadeeth_bn: string;
  hadeeth_ar: string | null;
  attribution_ar: string | null;
  grade_ar: string | null;
  explanation_bn: string | null;
  hints_bn: string[];
  categories: number[];
}

/** Du'a & dhikr sections (HadeethEnc category ids) in reading order. */
export const DUA_SECTIONS: { id: number; title: string }[] = [
  { id: 301, title: "সকাল ও সন্ধ্যার যিকির" },
  { id: 313, title: "মাসনূন দোয়া" },
  { id: 465, title: "সালাতের যিকির" },
  { id: 302, title: "সাধারণ যিকির" },
  { id: 303, title: "ঘরে প্রবেশ ও বের হওয়া" },
  { id: 306, title: "মসজিদে প্রবেশ ও বের হওয়া" },
  { id: 307, title: "কঠিন সময়ের দোয়া" },
  { id: 308, title: "বিভিন্ন পরিস্থিতির যিকির" },
  { id: 278, title: "যিকিরের ফযীলত" },
  { id: 279, title: "দোয়ার ফযীলত" },
  { id: 311, title: "দোয়ার আদব" },
  { id: 312, title: "দোয়া কবুলের কারণ" },
];

export const getHadithCategories = cache(async (): Promise<HadithCategory[]> => {
  const db = publicDb();
  if (!db) return [];
  const { data } = await db.from("hadith_categories").select("id, title_bn, parent_id, hadeeths_count").order("id").limit(1000);
  return (data ?? []) as HadithCategory[];
});

/** All category ids under (and including) a category. */
export function descendants(all: HadithCategory[], id: number): number[] {
  const out = [id];
  for (let i = 0; i < out.length; i++) for (const c of all) if (c.parent_id === out[i]) out.push(c.id);
  return out;
}

export function ancestors(all: HadithCategory[], id: number): HadithCategory[] {
  const chain: HadithCategory[] = [];
  let cur = all.find((c) => c.id === id);
  while (cur) {
    chain.unshift(cur);
    cur = cur.parent_id ? all.find((c) => c.id === cur!.parent_id) : undefined;
  }
  return chain;
}

const SUMMARY = "id, title_bn, grade_bn, attribution_bn";

export async function listHadiths(opts: { categoryIds?: number[]; q?: string; page?: number; pageSize?: number }) {
  const db = publicDb();
  if (!db) return { rows: [] as HadithSummary[], count: 0 };
  const size = opts.pageSize ?? 20;
  const page = Math.max(1, opts.page ?? 1);
  let query = db.from("hadiths").select(SUMMARY, { count: "exact" }).order("id");
  if (opts.categoryIds?.length) query = query.overlaps("categories", opts.categoryIds);
  if (opts.q) {
    const q = opts.q.replace(/[%,()]/g, " ").trim();
    if (q) query = query.or(`title_bn.ilike.%${q}%,hadeeth_bn.ilike.%${q}%`);
  }
  const { data, count } = await query.range((page - 1) * size, page * size - 1);
  return { rows: (data ?? []) as HadithSummary[], count: count ?? 0 };
}

export async function getHadith(id: number): Promise<Hadith | null> {
  const db = publicDb();
  if (!db) return null;
  const { data } = await db.from("hadiths").select("*").eq("id", id).maybeSingle();
  return (data as Hadith | null) ?? null;
}

/** Hadiths in given categories with full text (for the du'a page). */
export async function hadithsIn(categoryId: number, limit = 60): Promise<Hadith[]> {
  const db = publicDb();
  if (!db) return [];
  const { data } = await db.from("hadiths").select("*").contains("categories", [categoryId]).order("id").limit(limit);
  return (data ?? []) as Hadith[];
}

export async function relatedHadiths(h: Hadith, limit = 4): Promise<HadithSummary[]> {
  const db = publicDb();
  if (!db || !h.categories.length) return [];
  const { data } = await db.from("hadiths").select(SUMMARY).overlaps("categories", h.categories).neq("id", h.id).order("id").limit(limit);
  return (data ?? []) as HadithSummary[];
}

/** Short grade label for badges ("সহীহ", "হাসান" …). */
export function gradeTone(grade: string | null): "sahih" | "hasan" | "other" {
  if (!grade) return "other";
  if (grade.includes("সহীহ")) return "sahih";
  if (grade.includes("হাসান")) return "hasan";
  return "other";
}
