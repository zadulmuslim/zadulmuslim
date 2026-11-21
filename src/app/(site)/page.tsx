import { Hero } from "@/components/home/hero";
import { QaSection } from "@/components/home/qa-section";
import { ArticlesSection } from "@/components/home/articles-section";
import { HowToAsk } from "@/components/home/how-to-ask";
import { LecturesSection } from "@/components/home/lectures-section";
import { AskCta } from "@/components/home/ask-cta";
import { AppDownload } from "@/components/home/app-download";
import { siteConfig } from "@/config/site";
import { getHomepageData } from "@/lib/content";

/** Static page, refreshed every 5 minutes and immediately when content is published. */
export const revalidate = 300;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteConfig.nameBn,
  alternateName: siteConfig.name,
  url: siteConfig.url,
  inLanguage: "bn",
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteConfig.url}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default async function HomePage() {
  const data = await getHomepageData();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Hero />
      <QaSection
        groups={(data?.qaGroups ?? []).map((g) => ({ title: g.name_bn, slug: g.slug, questions: g.questions.map((q) => ({ title: q.title, slug: q.slug! })) }))}
        recent={(data?.recent ?? []).map((r) => ({ title: r.title, slug: r.slug!, published_at: r.published_at }))}
        topics={(data?.questionCategories ?? []).slice(0, 10)}
      />
      <ArticlesSection groups={data?.articleGroups ?? []} />
      <HowToAsk stats={data?.stats ?? null} />
      <LecturesSection />
      <AskCta />
      <AppDownload />
    </>
  );
}
