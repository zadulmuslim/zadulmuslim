import "server-only";
import { publicDb } from "@/lib/supabase/public";
import { bnSearchVariants } from "@/lib/format";
import { getSurahs } from "@/lib/quran";
import { toBnDigits } from "@/lib/utils";

/**
 * Site-wide search used by the live search box and /search.
 * Each group returns a page of hits plus its total count.
 */
export const SEARCH_TYPES = ["quran", "hadith", "qa", "articles", "lectures", "books"] as const;
export type SearchType = (typeof SEARCH_TYPES)[number];

export const TYPE_LABEL: Record<SearchType, string> = {
  quran: "আল-কুরআন",
  hadith: "হাদীস",
  qa: "প্রশ্নোত্তর",
  articles: "প্রবন্ধ",
  lectures: "বয়ান",
  books: "বই",
};

export interface Hit {
  title: string;
  href: string;
  snippet?: string;
  meta?: string;
}
export interface Group { type: SearchType; label: string; count: number; hits: Hit[] }
export interface Shortcut { title: string; href: string; hint: string }
export interface SearchResult { q: string; shortcuts: Shortcut[]; groups: Group[]; total: number }

const BN_DIGITS = (s: string) => s.replace(/[০-৯]/g, (d) => String(d.charCodeAt(0) - 0x09e6));
const clean = (s: string) => s.replace(/[%,()*\\]/g, " ").replace(/\s+/g, " ").trim();
const stripMd = (s: string) => s.replace(/[#>*_`~\[\]!|]/g, "").replace(/\(https?:[^)]+\)/g, "").replace(/\s+/g, " ").trim();

/** ~160 characters around the first match (works with either Unicode form). */
function snippet(text: string | null | undefined, q: string, size = 160): string | undefined {
  if (!text) return undefined;
  const plain = stripMd(text).normalize("NFC");
  const variants = bnSearchVariants(q).map((v) => v.normalize("NFC").toLowerCase());
  const lower = plain.toLowerCase();
  let at = -1;
  for (const v of variants) {
    at = lower.indexOf(v);
    if (at >= 0) break;
  }
  if (at < 0) return plain.slice(0, size) + (plain.length > size ? "…" : "");
  const start = Math.max(0, at - 60);
  return (start > 0 ? "…" : "") + plain.slice(start, start + size) + (start + size < plain.length ? "…" : "");
}

const PAGE_SHORTCUTS: { keys: string[]; title: string; href: string; hint: string }[] = [
  { keys: ["নামাজ", "নামায", "সালাত", "ওয়াক্ত", "সময়সূচি", "prayer"], title: "নামাজের সময়সূচি", href: "/prayer-times", hint: "৬৪ জেলার আজকের সময়" },
  { keys: ["সাহরি", "সেহরি", "ইফতার", "রমযান", "রোজা", "রোযা"], title: "সাহরি ও ইফতারের সময়", href: "/prayer-times", hint: "আপনার জেলার সময়সূচি" },
  { keys: ["যাকাত", "জাকাত", "নিসাব", "zakat"], title: "যাকাত ক্যালকুলেটর", href: "/zakat", hint: "যাকাতের হিসাব করুন" },
  { keys: ["দোয়া", "দু'আ", "দুআ", "দোআ", "যিকির", "জিকির", "আযকার"], title: "দোয়া ও যিকির", href: "/dua", hint: "সহীহ হাদীসের দোয়া" },
  { keys: ["সীরাত", "নবীজির জীবনী", "রাসূলের জীবনী"], title: "সীরাত", href: "/seerah", hint: "রাসূলুল্লাহ ﷺ-এর জীবনী" },
  { keys: ["জীবনী", "সাহাবী", "খলীফা", "খলিফা"], title: "জীবনী", href: "/biography", hint: "সাহাবী ও মনীষীদের জীবনী" },
  { keys: ["প্রশ্ন করুন", "প্রশ্ন করব", "জানতে চাই", "মাসআলা জানতে"], title: "প্রশ্ন করুন", href: "/ask", hint: "আলেমদের কাছে প্রশ্ন পাঠান" },
  { keys: ["বয়ান", "ভিডিও", "ওয়াজ", "লেকচার"], title: "বয়ান ও ভিডিও", href: "/lectures", hint: "বয়ান, দরস, হামদ-নাত" },
  { keys: ["বই", "লাইব্রেরি", "পিডিএফ", "pdf"], title: "লাইব্রেরি", href: "/library", hint: "ইসলামী বই" },
  { keys: ["আয়াতুল কুরসী", "আয়াতুল কুরসি", "আয়াতুল কুরসি"], title: "আয়াতুল কুরসী (২:২৫৫)", href: "/quran/2#a-255", hint: "সূরা আল-বাকারা, আয়াত ২৫৫" },
];

const normName = (s: string) => s.normalize("NFC").toLowerCase().replace(/^(আল|আন|আত|আর|আস|আশ|আয|আদ|al|an|at|ar|as|ash|az|ad)[-\s']/, "").replace(/[-'’\s.]/g, "");

async function shortcuts(q: string): Promise<Shortcut[]> {
  const out: Shortcut[] = [];
  const ascii = BN_DIGITS(q).trim();
  const surahs = await getSurahs();
  // "2:255", "২:২৫৫", "2 255"
  const ref = ascii.match(/^(\d{1,3})\s*[:।.\s-]\s*(\d{1,3})$/);
  if (ref) {
    const s = surahs.find((x) => x.number === Number(ref[1]));
    const a = Number(ref[2]);
    if (s && a >= 1 && a <= s.ayah_count) out.push({ title: `সূরা ${s.name_bn}, আয়াত ${toBnDigits(a)}`, href: `/quran/${s.number}#a-${a}`, hint: "কুরআনের আয়াতে যান" });
  } else if (/^\d{1,3}$/.test(ascii)) {
    const s = surahs.find((x) => x.number === Number(ascii));
    if (s) out.push({ title: `সূরা ${toBnDigits(s.number)}: ${s.name_bn}`, href: `/quran/${s.number}`, hint: `${s.meaning_bn} · ${toBnDigits(s.ayah_count)} আয়াত` });
  }
  const n = normName(q.replace(/^সূরা\s*/, "").replace(/^surah?\s*/i, ""));
  if (n.length >= 2) {
    for (const s of surahs) {
      if ([s.name_bn, s.name_translit, s.name_ar].some((x) => normName(x).startsWith(n) || (n.length >= 4 && normName(x).includes(n)))) {
        out.push({ title: `সূরা ${s.name_bn}`, href: `/quran/${s.number}`, hint: `${s.meaning_bn} · ${toBnDigits(s.ayah_count)} আয়াত · ${s.revelation === "meccan" ? "মাক্কী" : "মাদানী"}` });
      }
      if (out.length >= 4) break;
    }
  }
  const lq = q.normalize("NFC").toLowerCase();
  for (const p of PAGE_SHORTCUTS) {
    if (p.keys.some((k) => lq.includes(k.normalize("NFC").toLowerCase()) || (lq.length >= 3 && k.normalize("NFC").toLowerCase().startsWith(lq)))) {
      if (!out.some((o) => o.href === p.href)) out.push({ title: p.title, href: p.href, hint: p.hint });
    }
  }
  return out.slice(0, 5);
}

const orIlike = (cols: string[], q: string) => bnSearchVariants(q).flatMap((v) => cols.map((c) => `${c}.ilike.%${v}%`)).join(",");

async function searchType(type: SearchType, q: string, limit: number, offset: number): Promise<Group> {
  const db = publicDb();
  const empty = { type, label: TYPE_LABEL[type], count: 0, hits: [] };
  if (!db) return empty;
  const range = [offset, offset + limit - 1] as const;
  switch (type) {
    case "quran": {
      const [{ data, count }, surahs] = await Promise.all([
        db.from("quran_ayahs").select("surah, ayah, text_bn", { count: "exact" }).or(orIlike(["text_bn"], q)).order("surah").order("ayah").range(...range),
        getSurahs(),
      ]);
      return { ...empty, count: count ?? 0, hits: (data ?? []).map((a) => ({ title: `সূরা ${surahs.find((s) => s.number === a.surah)?.name_bn ?? ""} · ${toBnDigits(a.surah)}:${toBnDigits(a.ayah)}`, href: `/quran/${a.surah}#a-${a.ayah}`, snippet: snippet(a.text_bn, q) })) };
    }
    case "hadith": {
      const { data, count } = await db.from("hadiths").select("id, title_bn, hadeeth_bn, grade_bn, attribution_bn", { count: "exact" }).ilike("search_bn", `%${q.normalize("NFC")}%`).order("id").range(...range);
      return { ...empty, count: count ?? 0, hits: (data ?? []).map((h) => ({ title: h.title_bn, href: `/hadith/${h.id}`, snippet: snippet(h.hadeeth_bn, q), meta: [h.grade_bn && h.grade_bn.length < 20 ? h.grade_bn : null, h.attribution_bn].filter(Boolean).join(" · ") })) };
    }
    case "qa": {
      const { data, count } = await db.from("questions").select("slug, title, question, answer, question_categories(name_bn)", { count: "exact" }).eq("status", "answered").eq("is_public", true).or(orIlike(["title", "question", "answer"], q)).order("published_at", { ascending: false }).range(...range);
      return { ...empty, count: count ?? 0, hits: (data ?? []).map((r) => ({ title: r.title, href: `/qa/${r.slug}`, snippet: snippet(`${r.question ?? ""} ${r.answer ?? ""}`, q), meta: (r.question_categories as { name_bn: string } | null)?.name_bn ?? undefined })) };
    }
    case "articles": {
      const { data, count } = await db.from("articles").select("slug, title, excerpt, body, article_categories(name_bn)", { count: "exact" }).eq("status", "published").or(orIlike(["title", "excerpt", "body"], q)).order("published_at", { ascending: false }).range(...range);
      return { ...empty, count: count ?? 0, hits: (data ?? []).map((r) => ({ title: r.title, href: `/articles/${r.slug}`, snippet: snippet(`${r.excerpt ?? ""} ${r.body ?? ""}`, q), meta: (r.article_categories as { name_bn: string } | null)?.name_bn ?? undefined })) };
    }
    case "lectures": {
      const { data, count } = await db.from("lectures").select("slug, title, speaker, description", { count: "exact" }).eq("status", "published").or(orIlike(["title", "speaker", "description"], q)).order("published_at", { ascending: false }).range(...range);
      return { ...empty, count: count ?? 0, hits: (data ?? []).map((r) => ({ title: r.title, href: `/lectures/${r.slug}`, snippet: snippet(r.description, q), meta: r.speaker ?? undefined })) };
    }
    case "books": {
      const { data, count } = await db.from("books").select("slug, title, author_name, description", { count: "exact" }).eq("status", "published").or(orIlike(["title", "author_name", "description", "subject"], q)).order("published_at", { ascending: false }).range(...range);
      return { ...empty, count: count ?? 0, hits: (data ?? []).map((r) => ({ title: r.title, href: `/library/${r.slug}`, snippet: snippet(r.description, q), meta: r.author_name ?? undefined })) };
    }
  }
}

export async function search(rawQ: string, opts: { types?: SearchType[]; limit?: number; offset?: number } = {}): Promise<SearchResult> {
  const q = clean(rawQ).slice(0, 80);
  if (q.length < 2 && !/^\d{1,3}$/.test(BN_DIGITS(q))) return { q, shortcuts: [], groups: [], total: 0 };
  const types = opts.types?.length ? opts.types : [...SEARCH_TYPES];
  const [sc, ...groups] = await Promise.all([
    opts.offset ? Promise.resolve([]) : shortcuts(q),
    ...types.map((t) => searchType(t, q, opts.limit ?? 4, opts.offset ?? 0).catch(() => ({ type: t, label: TYPE_LABEL[t], count: 0, hits: [] }))),
  ]);
  return { q, shortcuts: sc as Shortcut[], groups: groups as Group[], total: (groups as Group[]).reduce((s, g) => s + g.count, 0) };
}
