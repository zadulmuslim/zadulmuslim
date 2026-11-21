import type { MetadataRoute } from "next";
import { sectionPages, siteConfig } from "@/config/site";
import { publicDb } from "@/lib/supabase/public";
import { DUA_SECTIONS } from "@/lib/hadith";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const fixed: MetadataRoute.Sitemap = ["", "/quran", "/hadith", "/dua", "/qa", "/articles", "/seerah", "/biography", "/lectures", "/library", "/prayer-times", "/zakat", "/ask", "/privacy", "/terms", ...Object.keys(sectionPages).map((s) => `/${s}`)].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
  const db = publicDb();
  if (!db) return fixed;
  const [qa, articles, hadiths, cats, lectures, books] = await Promise.all([
    db.from("questions").select("slug, updated_at").eq("status", "answered").eq("is_public", true).limit(5000),
    db.from("articles").select("slug, updated_at").eq("status", "published").limit(5000),
    // The API returns at most 1,000 rows per request, so hadith ids come in pages.
    Promise.all([0, 1, 2, 3].map((i) => db.from("hadiths").select("id").order("id").range(i * 1000, i * 1000 + 999))).then((pages) => ({ data: pages.flatMap((p) => p.data ?? []) })),
    db.from("hadith_categories").select("id").limit(1000),
    db.from("lectures").select("slug, updated_at").eq("status", "published").limit(5000),
    db.from("books").select("slug, updated_at").eq("status", "published").limit(5000),
  ]);
  return [
    ...fixed,
    ...(qa.data ?? []).filter((q) => q.slug).map((q) => ({ url: `${base}/qa/${encodeURIComponent(q.slug!)}`, lastModified: q.updated_at, priority: 0.8 })),
    ...(articles.data ?? []).map((a) => ({ url: `${base}/articles/${encodeURIComponent(a.slug)}`, lastModified: a.updated_at, priority: 0.8 })),
    ...Array.from({ length: 114 }, (_, i) => ({ url: `${base}/quran/${i + 1}`, changeFrequency: "yearly" as const, priority: 0.9 })),
    ...DUA_SECTIONS.map((d) => ({ url: `${base}/dua/${d.id}`, priority: 0.7 })),
    ...(cats.data ?? []).map((c) => ({ url: `${base}/hadith/category/${c.id}`, priority: 0.5 })),
    ...(hadiths.data ?? []).map((h) => ({ url: `${base}/hadith/${h.id}`, priority: 0.6 })),
    ...(lectures.data ?? []).map((l) => ({ url: `${base}/lectures/${encodeURIComponent(l.slug)}`, lastModified: l.updated_at, priority: 0.6 })),
    ...(books.data ?? []).map((b) => ({ url: `${base}/library/${encodeURIComponent(b.slug)}`, lastModified: b.updated_at, priority: 0.6 })),
  ];
}
