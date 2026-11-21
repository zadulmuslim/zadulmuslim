import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/content/breadcrumbs";
import { HadithList, HadithSources } from "@/components/hadith/parts";
import { Pagination } from "@/components/admin/pagination";
import { ancestors, descendants, getHadithCategories, listHadiths } from "@/lib/hadith";
import { toBnDigits } from "@/lib/utils";

export const revalidate = 604800;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const id = Number((await params).id);
  const c = (await getHadithCategories()).find((x) => x.id === id);
  return c ? { title: `${c.title_bn} — হাদীস`, alternates: { canonical: `/hadith/category/${id}` } } : {};
}

export default async function HadithCategoryPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ page?: string }> }) {
  const id = Number((await params).id);
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const cats = await getHadithCategories();
  const cat = cats.find((c) => c.id === id);
  if (!cat) notFound();
  const chain = ancestors(cats, id);
  const subs = cats.filter((c) => c.parent_id === id);
  const { rows, count } = await listHadiths({ categoryIds: descendants(cats, id), page });

  return (
    <section className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      <Breadcrumbs items={[{ label: "হোম", href: "/" }, { label: "হাদীস", href: "/hadith" }, ...chain.slice(0, -1).map((c) => ({ label: c.title_bn, href: `/hadith/category/${c.id}` })), { label: cat.title_bn }]} />
      <h1 className="text-2xl font-bold text-primary md:text-3xl">{cat.title_bn}</h1>
      <p className="mb-5 mt-1 text-sm text-muted-foreground">{toBnDigits(count)}টি হাদীস</p>
      {subs.length > 0 && (
        <ul className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
          {subs.map((s) => (
            <li key={s.id}><Link href={`/hadith/category/${s.id}`} className="block whitespace-nowrap rounded-full border bg-card px-4 py-1.5 text-sm hover:border-accent">{s.title_bn} <span className="text-xs text-muted-foreground">({toBnDigits(s.hadeeths_count)})</span></Link></li>
          ))}
        </ul>
      )}
      {rows.length ? <HadithList rows={rows} /> : <p className="rounded-xl border bg-card px-4 py-10 text-center text-sm text-muted-foreground">এই বিষয়ে এখনো কোনো হাদীস নেই।</p>}
      <Pagination page={page} pageCount={Math.ceil(count / 20)} makeHref={(n) => `/hadith/category/${id}?page=${n}`} />
      <HadithSources className="mt-10" />
    </section>
  );
}
