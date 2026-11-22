import { Comments } from "@/components/comments/comments";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, UserRound } from "lucide-react";
import { getArticleBySlug, relatedArticles } from "@/lib/content";
import { Markdown } from "@/components/content/markdown";
import { Breadcrumbs } from "@/components/content/breadcrumbs";
import { EditorialNote } from "@/components/content/editorial-note";
import { ShareButtons } from "@/components/content/share-buttons";
import { ArticleCard } from "@/components/content/article-card";
import { siteConfig } from "@/config/site";
import { formatBnDate } from "@/lib/format";
import { toBnDigits } from "@/lib/utils";

export const revalidate = 3600;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

type P = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: P }): Promise<Metadata> {
  const a = await getArticleBySlug(decodeURIComponent((await params).slug));
  if (!a) return { title: "প্রবন্ধ পাওয়া যায়নি" };
  const description = a.excerpt ?? a.body.replace(/[#>*_`!\[\]()-]/g, " ").replace(/\s+/g, " ").slice(0, 160);
  return {
    title: a.title,
    description,
    alternates: { canonical: `/articles/${a.slug}` },
    openGraph: {
      type: "article",
      title: a.title,
      description,
      url: `/articles/${a.slug}`,
      publishedTime: a.published_at ?? undefined,
      images: a.media?.public_url ? [{ url: a.media.public_url }] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: { params: P }) {
  const a = await getArticleBySlug(decodeURIComponent((await params).slug));
  if (!a) notFound();
  const related = await relatedArticles(a.category_id, a.id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.excerpt ?? undefined,
    image: a.media?.public_url ?? undefined,
    datePublished: a.published_at,
    dateModified: a.updated_at,
    inLanguage: "bn",
    author: a.author_name ? { "@type": "Person", name: a.author_name } : { "@type": "Organization", name: siteConfig.nameBn },
    publisher: { "@type": "Organization", name: siteConfig.nameBn },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="mx-auto max-w-3xl">
        <Breadcrumbs
          items={[
            { label: "হোম", href: "/" },
            { label: "প্রবন্ধ", href: "/articles" },
            ...(a.article_categories ? [{ label: a.article_categories.name_bn, href: `/articles?category=${a.article_categories.slug}` }] : []),
          ]}
        />
        <article>
          {a.article_categories && <p className="text-sm font-semibold text-accent">{a.article_categories.name_bn}</p>}
          <h1 className="mt-1 text-2xl font-bold leading-snug text-primary md:text-4xl">{a.title}</h1>
          {a.excerpt && <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{a.excerpt}</p>}
          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-y py-3 text-sm text-muted-foreground">
            {a.author_name && <span className="flex items-center gap-1.5"><UserRound className="size-4" />{a.author_name}</span>}
            <span className="flex items-center gap-1.5"><Clock className="size-4" />পড়তে {toBnDigits(a.reading_minutes ?? 1)} মিনিট</span>
            <span>{formatBnDate(a.published_at)}</span>
          </p>
          {a.media?.public_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={a.media.public_url} alt={a.media.alt_text ?? ""} className="mt-6 w-full rounded-xl border object-cover" />
          )}
          <div className="mt-8 text-[17px]">
            <Markdown>{a.body}</Markdown>
          </div>
          <EditorialNote />
          <div className="mt-6"><ShareButtons title={a.title} /></div>
          <Comments type="article" id={a.id} />
        </article>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 border-b-2 border-accent/70 pb-2 text-xl font-bold text-primary">আরও পড়ুন</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => <ArticleCard key={r.id} a={r} />)}
          </div>
        </section>
      )}
    </div>
  );
}
