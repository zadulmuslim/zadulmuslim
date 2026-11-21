import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Breadcrumbs } from "@/components/content/breadcrumbs";
import { QuranSources } from "@/components/quran/sources";
import { AyahList } from "@/components/quran/ayah-list";
import { SurahJump } from "@/components/quran/surah-jump";
import { getSurahs, getSurahWithAyahs, splitBasmala } from "@/lib/quran";
import { toBnDigits } from "@/lib/utils";
import { siteConfig } from "@/config/site";

export const revalidate = false;
export const dynamicParams = false;

export function generateStaticParams() {
  return Array.from({ length: 114 }, (_, i) => ({ surah: String(i + 1) }));
}

export async function generateMetadata({ params }: { params: Promise<{ surah: string }> }): Promise<Metadata> {
  const n = Number((await params).surah);
  const s = (await getSurahs()).find((x) => x.number === n);
  if (!s) return {};
  const title = `সূরা ${s.name_bn} (${s.name_ar}) — বাংলা অর্থসহ`;
  return {
    title,
    description: `সূরা ${s.name_bn}: ${s.meaning_bn}। ${toBnDigits(s.ayah_count)} আয়াত, ${s.revelation === "meccan" ? "মাক্কী" : "মাদানী"}। আরবি টেক্সট ও বাংলা অনুবাদ, টীকাসহ।`,
    alternates: { canonical: `/quran/${n}` },
    openGraph: { title, url: `/quran/${n}`, type: "article" },
  };
}

export default async function SurahPage({ params }: { params: Promise<{ surah: string }> }) {
  const n = Number((await params).surah);
  const [data, surahs] = await Promise.all([getSurahWithAyahs(n), getSurahs()]);
  if (!data) notFound();
  const { surah, ayahs } = data;
  const basmala = n === 1 ? null : (await getSurahWithAyahs(1))?.ayahs[0]?.text_ar ?? null;
  const prev = surahs.find((s) => s.number === n - 1);
  const next = surahs.find((s) => s.number === n + 1);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Chapter",
    name: `সূরা ${surah.name_bn}`,
    alternateName: [surah.name_ar, surah.name_translit],
    position: n,
    inLanguage: ["ar", "bn"],
    isPartOf: { "@type": "Book", name: "আল-কুরআন", inLanguage: "ar" },
    url: `${siteConfig.url}/quran/${n}`,
  };

  return (
    <article className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumbs items={[{ label: "হোম", href: "/" }, { label: "আল-কুরআন", href: "/quran" }, { label: `সূরা ${surah.name_bn}` }]} />

      <header className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-deep to-primary px-6 py-8 text-center text-white shadow-md">
        <span aria-hidden className="pointer-events-none absolute -left-6 -top-6 text-[140px] leading-none text-white/5">۞</span>
        <p className="text-sm text-accent">সূরা {toBnDigits(n)}</p>
        <p lang="ar" dir="rtl" className="font-quran mt-1 text-4xl">{surah.name_ar}</p>
        <h1 className="mt-2 text-2xl font-bold">সূরা {surah.name_bn}</h1>
        <p className="mt-1 text-sm text-white/80">
          অর্থ: {surah.meaning_bn} · {toBnDigits(surah.ayah_count)} আয়াত · {surah.revelation === "meccan" ? "মাক্কী" : "মাদানী"}
        </p>
      </header>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <SurahJump current={n} surahs={surahs.map((s) => ({ number: s.number, name_bn: s.name_bn }))} ayahCount={surah.ayah_count} />
      </div>

      {basmala && n !== 9 && (
        <p lang="ar" dir="rtl" className="font-quran mb-6 text-center text-3xl leading-loose text-primary">{basmala}</p>
      )}

      <AyahList
        surah={n}
        ayahs={ayahs.map((a) => ({ ...a, text_ar: basmala ? splitBasmala(n, a.ayah, a.text_ar, basmala) : a.text_ar }))}
      />

      <nav aria-label="সূরা পরিবর্তন" className="mt-10 grid gap-3 sm:grid-cols-2">
        {prev ? (
          <Link href={`/quran/${prev.number}`} className="flex items-center gap-2 rounded-xl border bg-card p-4 hover:border-accent">
            <ChevronLeft className="size-5 text-primary" />
            <span><span className="block text-xs text-muted-foreground">আগের সূরা</span><span className="font-semibold">{toBnDigits(prev.number)}. {prev.name_bn}</span></span>
          </Link>
        ) : <span />}
        {next && (
          <Link href={`/quran/${next.number}`} className="flex items-center justify-end gap-2 rounded-xl border bg-card p-4 text-right hover:border-accent">
            <span><span className="block text-xs text-muted-foreground">পরের সূরা</span><span className="font-semibold">{toBnDigits(next.number)}. {next.name_bn}</span></span>
            <ChevronRight className="size-5 text-primary" />
          </Link>
        )}
      </nav>
      <QuranSources className="mt-8" />
    </article>
  );
}
