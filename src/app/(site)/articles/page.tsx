import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { getArticleCategories, listArticles } from "@/lib/content";
import { Breadcrumbs } from "@/components/content/breadcrumbs";
import { ArticleCard } from "@/components/content/article-card";
import { Pagination } from "@/components/admin/pagination";
import { cn, toBnDigits } from "@/lib/utils";

export const revalidate = 300;
type SP = Promise<{ category?: string; q?: string; page?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const { category } = await searchParams;
  const cat = (await getArticleCategories()).find((c) => c.slug === category);
  return {
    title: cat ? `${cat.name_bn} — প্রবন্ধ` : "বিষয়ভিত্তিক প্রবন্ধ",
    description: cat?.description_bn ?? "নির্ভরযোগ্য আলেমদের লেখা গবেষণাধর্মী ও সহজবোধ্য প্রবন্ধ।",
    alternates: { canonical: cat ? `/articles?category=${cat.slug}` : "/articles" },
  };
}

export default async function ArticlesIndex({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const categories = await getArticleCategories();
  const cat = categories.find((c) => c.slug === sp.category);
  const q = (sp.q ?? "").trim().slice(0, 100);
  const page = Math.max(1, Number(sp.page) || 1);
  const { rows, count } = await listArticles({ categoryId: cat?.id, q: q || undefined, page });

  const href = (p: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    Object.entries({ category: cat?.slug, q: q || undefined, ...p }).forEach(([k, v]) => v && params.set(k, v));
    const s = params.toString();
    return `/articles${s ? `?${s}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
      <Breadcrumbs items={[{ label: "হোম", href: "/" }, { label: "প্রবন্ধ", href: cat ? "/articles" : undefined }, ...(cat ? [{ label: cat.name_bn }] : [])]} />
      <div className="mb-6 flex flex-col gap-4 border-b-2 border-accent/70 pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary md:text-3xl">{cat ? cat.name_bn : "বিষয়ভিত্তিক প্রবন্ধ"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{cat?.description_bn ?? "নির্ভরযোগ্য আলেমদের লেখা গবেষণাধর্মী ও সহজবোধ্য প্রবন্ধ।"} · {toBnDigits(count)}টি</p>
        </div>
        <form action="/articles" className="relative w-full md:w-80">
          {cat && <input type="hidden" name="category" value={cat.slug} />}
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input name="q" defaultValue={q} placeholder="প্রবন্ধে খুঁজুন…" aria-label="প্রবন্ধে খুঁজুন" className="h-11 w-full rounded-full border bg-card pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </form>
      </div>
      <ul className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        <li className="shrink-0"><Link href={href({ category: undefined, page: undefined })} className={cn("block whitespace-nowrap rounded-full border px-4 py-1.5 text-sm", !cat ? "border-primary bg-primary text-white" : "bg-card hover:border-accent")}>সব</Link></li>
        {categories.map((c) => (
          <li key={c.id} className="shrink-0">
            <Link href={href({ category: c.slug, page: undefined })} className={cn("block whitespace-nowrap rounded-full border px-4 py-1.5 text-sm", cat?.id === c.id ? "border-primary bg-primary text-white" : "bg-card hover:border-accent")}>{c.name_bn}</Link>
          </li>
        ))}
      </ul>
      {rows.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((a) => <ArticleCard key={a.id} a={a} />)}
        </div>
      ) : (
        <p className="rounded-xl border bg-card px-6 py-14 text-center text-muted-foreground">{q ? "কোনো প্রবন্ধ পাওয়া যায়নি।" : "এই বিষয়ে এখনো কোনো প্রবন্ধ প্রকাশিত হয়নি।"}</p>
      )}
      <Pagination page={page} pageCount={Math.ceil(count / 12)} makeHref={(p) => href({ page: String(p) })} />
    </div>
  );
}
