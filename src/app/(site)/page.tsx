import { Hero } from "@/components/home/hero";
import { QaSection } from "@/components/home/qa-section";
import { ArticlesSection } from "@/components/home/articles-section";
import { HowToAsk } from "@/components/home/how-to-ask";
import { LecturesSection } from "@/components/home/lectures-section";
import { AskCta } from "@/components/home/ask-cta";
import { Testimonials } from "@/components/home/testimonials";
import { AppDownload } from "@/components/home/app-download";
import { siteConfig } from "@/config/site";

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

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Hero />
      <QaSection />
      <ArticlesSection />
      <HowToAsk />
      <LecturesSection />
      <AskCta />
      <Testimonials />
      <AppDownload />
    </>
  );
}
