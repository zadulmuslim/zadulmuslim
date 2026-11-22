import { Comments } from "@/components/comments/comments";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lightbulb } from "lucide-react";
import { Breadcrumbs } from "@/components/content/breadcrumbs";
import { GradeBadge, HadithList, HadithSources } from "@/components/hadith/parts";
import { ShareButtons } from "@/components/content/share-buttons";
import { getHadith, getHadithCategories, relatedHadiths } from "@/lib/hadith";
import { siteConfig } from "@/config/site";
import { toBnDigits } from "@/lib/utils";

export const revalidate = 604800;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const h = await getHadith(Number((await params).id));
  if (!h) return {};
  const title = h.title_bn.replace(/^[“"]|[”"]$/g, "").slice(0, 90);
  return {
    title: `${title} — হাদীস`,
    description: h.hadeeth_bn.slice(0, 160),
    alternates: { canonical: `/hadith/${h.id}` },
    openGraph: { title, type: "article", url: `/hadith/${h.id}` },
  };
}

export default async function HadithDetail({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [h, cats] = await Promise.all([getHadith(id), getHadithCategories()]);
  if (!h) notFound();
  const related = await relatedHadiths(h);
  const tags = cats.filter((c) => h.categories.includes(c.id));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Quotation",
    text: h.hadeeth_bn,
    inLanguage: "bn",
    creator: { "@type": "Person", name: "মুহাম্মাদ ﷺ" },
    citation: h.attribution_bn ?? undefined,
    url: `${siteConfig.url}/hadith/${h.id}`,
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumbs items={[{ label: "হোম", href: "/" }, { label: "হাদীস", href: "/hadith" }, ...(tags[0] ? [{ label: tags[0].title_bn, href: `/hadith/category/${tags[0].id}` }] : []), { label: `হাদীস ${toBnDigits(h.id)}` }]} />
      <h1 className="text-2xl font-bold leading-snug text-primary md:text-3xl">{h.title_bn}</h1>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <GradeBadge grade={h.grade_bn} className="text-xs" />
        {h.attribution_bn && <span className="text-muted-foreground">বর্ণনায়: {h.attribution_bn}</span>}
      </div>

      {h.hadeeth_ar && (
        <div className="mt-6 rounded-2xl border bg-card p-5 shadow-sm">
          <p lang="ar" dir="rtl" className="font-arabic text-2xl leading-[2.1]">{h.hadeeth_ar}</p>
          {h.attribution_ar && <p lang="ar" dir="rtl" className="font-arabic mt-2 text-sm text-muted-foreground">[{h.attribution_ar}]</p>}
        </div>
      )}

      <section className="mt-5 rounded-2xl border-l-4 border-accent bg-card p-5 shadow-sm">
        <h2 className="mb-2 text-sm font-bold text-accent-foreground/80">অনুবাদ</h2>
        <p className="whitespace-pre-line text-lg leading-relaxed">{h.hadeeth_bn}</p>
      </section>

      {h.explanation_bn && (
        <section className="mt-6">
          <h2 className="mb-2 text-xl font-bold text-primary">ব্যাখ্যা</h2>
          <p className="whitespace-pre-line leading-relaxed text-foreground/90">{h.explanation_bn}</p>
        </section>
      )}

      {h.hints_bn?.length > 0 && (
        <section className="mt-6 rounded-2xl bg-secondary/40 p-5">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-primary"><Lightbulb className="size-5 text-accent" /> হাদীসের শিক্ষা</h2>
          <ol className="list-decimal space-y-2 pl-5 leading-relaxed marker:font-bold marker:text-primary">
            {h.hints_bn.map((t, i) => <li key={i}>{t}</li>)}
          </ol>
        </section>
      )}

      {tags.length > 0 && (
        <ul className="mt-6 flex flex-wrap gap-2">
          {tags.map((c) => <li key={c.id}><Link href={`/hadith/category/${c.id}`} className="inline-block rounded-full border bg-card px-3 py-1 text-xs hover:border-accent hover:text-primary">#{c.title_bn}</Link></li>)}
        </ul>
      )}
      <div className="mt-6"><ShareButtons title={h.title_bn} /></div>
      <Comments type="hadith" id={h.id} />

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-bold text-primary">একই বিষয়ের আরও হাদীস</h2>
          <HadithList rows={related} />
        </section>
      )}
      <HadithSources className="mt-10" />
    </article>
  );
}
