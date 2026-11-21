import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Search } from "lucide-react";
import { Breadcrumbs } from "@/components/content/breadcrumbs";
import { HadithList, HadithSources } from "@/components/hadith/parts";
import { Pagination } from "@/components/admin/pagination";
import { getHadithCategories, listHadiths } from "@/lib/hadith";
import { toBnDigits } from "@/lib/utils";

export const metadata: Metadata = {
  title: "হাদীস — বাংলা অনুবাদ ও ব্যাখ্যা",
  description: "সহীহ ও হাসান হাদীসের আরবি মূল পাঠ, বাংলা অনুবাদ, ব্যাখ্যা ও শিক্ষা — বিষয়ভিত্তিক সংকলন।",
  alternates: { canonical: "/hadith" },
};

export default async function HadithPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { q = "", page: p } = await searchParams;
  const page = Math.max(1, Number(p) || 1);
  const cats = await getHadithCategories();
  const roots = cats.filter((c) => c.parent_id === null);
  const total = roots.reduce((s, c) => s + c.hadeeths_count, 0);
  const results = q ? await listHadiths({ q, page }) : null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <Breadcrumbs items={[{ label: "হোম", href: "/" }, { label: "হাদীস" }]} />
      <div className="mb-8 rounded-2xl bg-gradient-to-br from-brand-deep to-primary px-6 py-8 text-white shadow-md">
        <h1 className="text-3xl font-bold">হাদীস</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/80">রাসূলুল্লাহ ﷺ-এর বাণী — আরবি মূল পাঠ, বাংলা অনুবাদ, মান নির্ণয়, ব্যাখ্যা ও শিক্ষাসহ বিষয়ভিত্তিক সংকলন।</p>
        <form action="/hadith" className="mt-5 flex max-w-xl items-center gap-2 rounded-full bg-white/95 p-1.5 pl-4">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <label htmlFor="hq" className="sr-only">হাদীস খুঁজুন</label>
          <input id="hq" name="q" defaultValue={q} placeholder="শব্দ লিখে হাদীস খুঁজুন… যেমন: নিয়ত" className="h-10 min-w-0 flex-1 bg-transparent text-sm text-foreground focus:outline-none" />
          <button className="h-10 rounded-full bg-primary px-5 text-sm font-semibold text-white">খুঁজুন</button>
        </form>
      </div>

      {results ? (
        <div>
          <p className="mb-3 text-sm text-muted-foreground">“{q}” — {toBnDigits(results.count)}টি হাদীস পাওয়া গেছে · <Link href="/hadith" className="text-primary underline">সব বিষয়</Link></p>
          {results.rows.length ? <HadithList rows={results.rows} /> : <p className="rounded-xl border bg-card px-4 py-10 text-center text-sm text-muted-foreground">কোনো হাদীস পাওয়া যায়নি। অন্য শব্দ দিয়ে চেষ্টা করুন।</p>}
          <Pagination page={page} pageCount={Math.ceil(results.count / 20)} makeHref={(n) => `/hadith?q=${encodeURIComponent(q)}&page=${n}`} />
        </div>
      ) : (
        <>
          <h2 className="mb-4 text-xl font-bold text-primary">বিষয়ভিত্তিক হাদীস <span className="text-sm font-normal text-muted-foreground">({toBnDigits(total)}+)</span></h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roots.map((c) => {
              const subs = cats.filter((s) => s.parent_id === c.id).slice(0, 4);
              return (
                <li key={c.id} className="flex flex-col rounded-2xl border bg-card p-5 shadow-sm">
                  <Link href={`/hadith/category/${c.id}`} className="group flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white"><BookOpen className="size-5" /></span>
                    <span>
                      <span className="block font-bold leading-snug group-hover:text-primary">{c.title_bn}</span>
                      <span className="text-xs text-muted-foreground">{toBnDigits(c.hadeeths_count)}টি হাদীস</span>
                    </span>
                  </Link>
                  {subs.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {subs.map((s) => (
                        <li key={s.id}><Link href={`/hadith/category/${s.id}`} className="inline-block rounded-full border px-2.5 py-1 text-xs hover:border-accent hover:text-primary">{s.title_bn}</Link></li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-6 text-sm"><Link href="/dua" className="font-semibold text-primary underline">দৈনন্দিন দোয়া ও যিকির দেখুন →</Link></p>
        </>
      )}
      <HadithSources className="mt-10" />
    </section>
  );
}
