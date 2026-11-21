import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Search } from "lucide-react";
import { listArticles, listQuestions } from "@/lib/content";
import { getSurahs, searchAyahs } from "@/lib/quran";
import { listHadiths } from "@/lib/hadith";
import { GradeBadge } from "@/components/hadith/parts";
import { Breadcrumbs } from "@/components/content/breadcrumbs";
import { ArticleCard } from "@/components/content/article-card";
import { formatBnDate } from "@/lib/format";
import { toBnDigits } from "@/lib/utils";

export const metadata: Metadata = { title: "অনুসন্ধান", robots: { index: false, follow: true } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim().slice(0, 100);
  const empty = { rows: [], count: 0 };
  const [qa, articles, ayahs, hadiths, surahs] = q
    ? await Promise.all([listQuestions({ q, pageSize: 10 }), listArticles({ q, pageSize: 6 }), searchAyahs(q, 6), listHadiths({ q, pageSize: 6 }), getSurahs()])
    : [empty, empty, empty, empty, []];
  const surahName = (n: number) => surahs.find((s) => s.number === n)?.name_bn ?? "";
  const nothing = !qa.rows.length && !articles.rows.length && !ayahs.rows.length && !hadiths.rows.length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-10">
      <Breadcrumbs items={[{ label: "হোম", href: "/" }, { label: "অনুসন্ধান" }]} />
      <form action="/search" role="search" className="flex items-center gap-2 rounded-full border bg-card p-1.5 shadow-sm">
        <Search className="ml-3 size-5 text-muted-foreground" aria-hidden />
        <input name="q" defaultValue={q} required autoFocus={!q} placeholder="কুরআন, হাদীস, প্রশ্নোত্তর বা প্রবন্ধে খুঁজুন…" aria-label="অনুসন্ধান" className="h-11 min-w-0 flex-1 bg-transparent px-2 focus:outline-none" />
        <button type="submit" className="h-11 rounded-full bg-primary px-6 font-semibold text-white">খুঁজুন</button>
      </form>

      {q && (
        <p className="mt-4 text-sm text-muted-foreground">
          &ldquo;{q}&rdquo;-এর জন্য {toBnDigits(ayahs.count)}টি আয়াত, {toBnDigits(hadiths.count)}টি হাদীস, {toBnDigits(qa.count)}টি প্রশ্নোত্তর ও {toBnDigits(articles.count)}টি প্রবন্ধ পাওয়া গেছে
        </p>
      )}

      {q && ayahs.rows.length > 0 && (
        <section className="mt-8">
          <div className="mb-3 flex items-end justify-between border-b-2 border-accent/70 pb-2">
            <h2 className="text-xl font-bold text-primary">আল-কুরআন</h2>
            {ayahs.count > ayahs.rows.length && <span className="text-sm text-muted-foreground">প্রথম {toBnDigits(ayahs.rows.length)}টি দেখানো হচ্ছে</span>}
          </div>
          <ul className="divide-y overflow-hidden rounded-xl border bg-card">
            {ayahs.rows.map((a) => (
              <li key={`${a.surah}:${a.ayah}`}>
                <Link href={`/quran/${a.surah}#a-${a.ayah}`} className="group block px-5 py-3.5 hover:bg-secondary/40">
                  <span className="text-xs font-semibold text-primary">সূরা {surahName(a.surah)} · {toBnDigits(a.surah)}:{toBnDigits(a.ayah)}</span>
                  <span className="mt-0.5 line-clamp-2 block text-sm leading-relaxed group-hover:text-primary">{a.text_bn}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {q && hadiths.rows.length > 0 && (
        <section className="mt-8">
          <div className="mb-3 flex items-end justify-between border-b-2 border-accent/70 pb-2">
            <h2 className="text-xl font-bold text-primary">হাদীস</h2>
            {hadiths.count > hadiths.rows.length && <Link href={`/hadith?q=${encodeURIComponent(q)}`} className="text-sm text-muted-foreground hover:text-primary">সব দেখুন</Link>}
          </div>
          <ul className="divide-y overflow-hidden rounded-xl border bg-card">
            {hadiths.rows.map((h) => (
              <li key={h.id}>
                <Link href={`/hadith/${h.id}`} className="group block px-5 py-3.5 hover:bg-secondary/40">
                  <span className="block font-medium group-hover:text-primary">{h.title_bn}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><GradeBadge grade={h.grade_bn} />{h.attribution_bn}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {q && qa.rows.length > 0 && (
        <section className="mt-8">
          <div className="mb-3 flex items-end justify-between border-b-2 border-accent/70 pb-2">
            <h2 className="text-xl font-bold text-primary">প্রশ্নোত্তর</h2>
            {qa.count > qa.rows.length && <Link href={`/qa?q=${encodeURIComponent(q)}`} className="text-sm text-muted-foreground hover:text-primary">সব দেখুন</Link>}
          </div>
          <ul className="divide-y overflow-hidden rounded-xl border bg-card">
            {qa.rows.map((r) => (
              <li key={r.id}>
                <Link href={`/qa/${r.slug}`} className="group flex gap-3 px-5 py-3.5 hover:bg-secondary/40">
                  <ChevronLeft className="mt-1.5 size-4 shrink-0 rotate-180 text-accent" />
                  <span><span className="block font-medium group-hover:text-primary">{r.title}</span><span className="text-xs text-muted-foreground">{r.question_categories?.name_bn ?? "সাধারণ"} · {formatBnDate(r.published_at)}</span></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {q && articles.rows.length > 0 && (
        <section className="mt-10">
          <div className="mb-3 flex items-end justify-between border-b-2 border-accent/70 pb-2">
            <h2 className="text-xl font-bold text-primary">প্রবন্ধ</h2>
            {articles.count > articles.rows.length && <Link href={`/articles?q=${encodeURIComponent(q)}`} className="text-sm text-muted-foreground hover:text-primary">সব দেখুন</Link>}
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{articles.rows.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
        </section>
      )}

      {q && nothing && (
        <div className="mt-10 rounded-xl border bg-card px-6 py-12 text-center">
          <p className="text-muted-foreground">কিছু পাওয়া যায়নি। অন্য শব্দে খুঁজুন, অথবা সরাসরি প্রশ্ন করুন।</p>
          <Link href="/ask" className="mt-4 inline-block rounded-full bg-accent px-5 py-2 text-sm font-semibold text-brand-deep">প্রশ্ন করুন</Link>
        </div>
      )}
    </div>
  );
}
