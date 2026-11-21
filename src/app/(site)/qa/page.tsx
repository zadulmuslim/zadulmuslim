import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, MessageCircleQuestion, Search } from "lucide-react";
import { getQuestionCategories, listQuestions } from "@/lib/content";
import { Breadcrumbs } from "@/components/content/breadcrumbs";
import { Pagination } from "@/components/admin/pagination";
import { formatBnDate } from "@/lib/format";
import { cn, toBnDigits } from "@/lib/utils";

export const revalidate = 300;

type SP = Promise<{ category?: string; q?: string; page?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const { category } = await searchParams;
  const cat = (await getQuestionCategories()).find((c) => c.slug === category);
  return {
    title: cat ? `${cat.name_bn} — প্রশ্নোত্তর` : "প্রশ্নোত্তর",
    description: "বিজ্ঞ আলেমগণের কুরআন-সুন্নাহভিত্তিক শরয়ী সমাধান — নামায, বিবাহ, আধুনিক মাসায়েল, আকিদা ও আরও অনেক বিষয়ে।",
    alternates: { canonical: cat ? `/qa?category=${cat.slug}` : "/qa" },
  };
}

export default async function QaIndex({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const categories = await getQuestionCategories();
  const cat = categories.find((c) => c.slug === sp.category);
  const q = (sp.q ?? "").trim().slice(0, 100);
  const page = Math.max(1, Number(sp.page) || 1);
  const { rows, count } = await listQuestions({ categoryId: cat?.id, q: q || undefined, page });

  const href = (p: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    Object.entries({ category: cat?.slug, q: q || undefined, ...p }).forEach(([k, v]) => v && params.set(k, v));
    const s = params.toString();
    return `/qa${s ? `?${s}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
      <Breadcrumbs items={[{ label: "হোম", href: "/" }, { label: "প্রশ্নোত্তর", href: cat ? "/qa" : undefined }, ...(cat ? [{ label: cat.name_bn }] : [])]} />
      <div className="mb-6 flex flex-col gap-4 border-b-2 border-accent/70 pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary md:text-3xl">{cat ? cat.name_bn : "প্রশ্নোত্তর"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{toBnDigits(count)}টি প্রশ্নোত্তর{q && ` · "${q}" অনুসন্ধান`}</p>
        </div>
        <form action="/qa" className="relative w-full md:w-80">
          {cat && <input type="hidden" name="category" value={cat.slug} />}
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input name="q" defaultValue={q} placeholder="প্রশ্নোত্তরে খুঁজুন…" aria-label="প্রশ্নোত্তরে খুঁজুন" className="h-11 w-full rounded-full border bg-card pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </form>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside aria-label="বিষয়" className="lg:sticky lg:top-24 lg:self-start">
          <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible">
            <li className="shrink-0">
              <Link href={href({ category: undefined, page: undefined })} className={cn("block rounded-lg px-3 py-2 text-sm", !cat ? "bg-primary font-semibold text-white" : "bg-card hover:bg-secondary lg:bg-transparent")}>
                সব বিষয়
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.id} className="shrink-0">
                <Link href={href({ category: c.slug, page: undefined })} className={cn("block rounded-lg px-3 py-2 text-sm", cat?.id === c.id ? "bg-primary font-semibold text-white" : "bg-card hover:bg-secondary lg:bg-transparent")}>
                  {c.name_bn}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/ask" className="mt-4 hidden items-center gap-2 rounded-xl bg-brand-deep p-4 text-sm font-semibold text-white lg:flex">
            <MessageCircleQuestion className="size-5 text-accent" /> আপনার প্রশ্ন জিজ্ঞাসা করুন
          </Link>
        </aside>

        <section>
          {rows.length ? (
            <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-sm">
              {rows.map((r) => (
                <li key={r.id}>
                  <Link href={`/qa/${r.slug}`} className="group flex items-start gap-3 px-5 py-4 hover:bg-secondary/40">
                    <ChevronLeft className="mt-1.5 size-4 shrink-0 rotate-180 text-accent" aria-hidden />
                    <span className="min-w-0">
                      <span className="block font-medium leading-relaxed group-hover:text-primary">{r.title}</span>
                      <span className="text-xs text-muted-foreground">{r.question_categories?.name_bn ?? "সাধারণ"} · {formatBnDate(r.published_at)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl border bg-card px-6 py-14 text-center">
              <p className="text-muted-foreground">{q ? "আপনার অনুসন্ধানের সাথে মেলে এমন প্রশ্নোত্তর পাওয়া যায়নি।" : "এই বিষয়ে এখনো কোনো প্রশ্নোত্তর প্রকাশিত হয়নি।"}</p>
              <Link href="/ask" className="mt-4 inline-block rounded-full bg-accent px-5 py-2 text-sm font-semibold text-brand-deep">প্রশ্ন করুন</Link>
            </div>
          )}
          <Pagination page={page} pageCount={Math.ceil(count / 20)} makeHref={(p) => href({ page: String(p) })} />
        </section>
      </div>
    </div>
  );
}
