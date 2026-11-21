import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MessageCircleQuestion } from "lucide-react";
import { getQuestionBySlug, relatedQuestions } from "@/lib/content";
import { Markdown } from "@/components/content/markdown";
import { Breadcrumbs } from "@/components/content/breadcrumbs";
import { EditorialNote } from "@/components/content/editorial-note";
import { ShareButtons } from "@/components/content/share-buttons";
import { siteConfig } from "@/config/site";
import { formatBnDate } from "@/lib/format";

export const revalidate = 3600;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

type P = Promise<{ slug: string }>;

const plain = (md: string, n: number) => md.replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/[#>*_`[\]()-]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);

export async function generateMetadata({ params }: { params: P }): Promise<Metadata> {
  const q = await getQuestionBySlug(decodeURIComponent((await params).slug));
  if (!q) return { title: "প্রশ্ন পাওয়া যায়নি" };
  const description = plain(q.answer ?? q.question, 160);
  return {
    title: q.title,
    description,
    alternates: { canonical: `/qa/${q.slug}` },
    openGraph: { type: "article", title: q.title, description, url: `/qa/${q.slug}`, publishedTime: q.published_at ?? undefined },
  };
}

export default async function QuestionPage({ params }: { params: P }) {
  const slug = decodeURIComponent((await params).slug);
  const q = await getQuestionBySlug(slug);
  if (!q) notFound();
  const related = await relatedQuestions(q.category_id, q.id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: q.title,
      text: q.question,
      datePublished: q.published_at,
      answerCount: 1,
      acceptedAnswer: { "@type": "Answer", text: plain(q.answer ?? "", 2000), datePublished: q.answered_at ?? q.published_at, author: { "@type": "Organization", name: siteConfig.nameBn } },
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Breadcrumbs
        items={[
          { label: "হোম", href: "/" },
          { label: "প্রশ্নোত্তর", href: "/qa" },
          ...(q.question_categories ? [{ label: q.question_categories.name_bn, href: `/qa?category=${q.question_categories.slug}` }] : []),
        ]}
      />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article className="min-w-0">
          <h1 className="text-2xl font-bold leading-snug text-primary md:text-3xl">{q.title}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" /> প্রকাশ: {formatBnDate(q.published_at)}
          </p>

          <section aria-label="প্রশ্ন" className="mt-6 rounded-xl border-l-4 border-accent bg-card p-5 shadow-sm">
            <p className="mb-2 text-xs font-bold text-accent">প্রশ্ন</p>
            <p className="whitespace-pre-line leading-relaxed">{q.question}</p>
          </section>

          <section aria-label="উত্তর" className="mt-6 rounded-xl border bg-card p-5 shadow-sm md:p-7">
            <p className="mb-1 text-xs font-bold text-primary">উত্তর</p>
            <p lang="ar" dir="rtl" className="mb-4 font-arabic text-lg text-accent">بسم الله الرحمن الرحيم</p>
            <Markdown>{q.answer ?? ""}</Markdown>
            <p lang="ar" dir="rtl" className="mt-6 text-left font-arabic text-accent">والله أعلم بالصواب</p>
          </section>

          <EditorialNote />
          <div className="mt-6"><ShareButtons title={q.title} /></div>
        </article>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {related.length > 0 && (
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <h2 className="mb-3 border-b pb-2 font-bold text-primary">সম্পর্কিত প্রশ্নোত্তর</h2>
              <ul className="space-y-2.5 text-sm">
                {related.map((r) => (
                  <li key={r.id}><Link href={`/qa/${r.slug}`} className="hover:text-primary">{r.title}</Link></li>
                ))}
              </ul>
            </div>
          )}
          <Link href="/ask" className="flex items-center gap-3 rounded-xl bg-brand-deep p-5 text-white">
            <MessageCircleQuestion className="size-8 shrink-0 text-accent" />
            <span>
              <span className="block font-bold">আপনার প্রশ্ন আছে?</span>
              <span className="text-xs text-white/80">নাম গোপন রেখে আলেমগণকে জিজ্ঞাসা করুন</span>
            </span>
          </Link>
        </aside>
      </div>
    </div>
  );
}
