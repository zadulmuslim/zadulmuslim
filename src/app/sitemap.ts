import type { MetadataRoute } from "next";
import { sectionPages, siteConfig } from "@/config/site";
import { publicDb } from "@/lib/supabase/public";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const fixed: MetadataRoute.Sitemap = ["", "/qa", "/articles", "/ask", ...Object.keys(sectionPages).map((s) => `/${s}`)].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
  const db = publicDb();
  if (!db) return fixed;
  const [qa, articles] = await Promise.all([
    db.from("questions").select("slug, updated_at").eq("status", "answered").eq("is_public", true).limit(5000),
    db.from("articles").select("slug, updated_at").eq("status", "published").limit(5000),
  ]);
  return [
    ...fixed,
    ...(qa.data ?? []).filter((q) => q.slug).map((q) => ({ url: `${base}/qa/${encodeURIComponent(q.slug!)}`, lastModified: q.updated_at, priority: 0.8 })),
    ...(articles.data ?? []).map((a) => ({ url: `${base}/articles/${encodeURIComponent(a.slug)}`, lastModified: a.updated_at, priority: 0.8 })),
  ];
}
