import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/content/breadcrumbs";
import { SurahList } from "@/components/quran/surah-list";
import { QuranSources } from "@/components/quran/sources";
import { getSurahs } from "@/lib/quran";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "আল-কুরআন — আরবি ও বাংলা অনুবাদ",
  description: "১১৪টি সূরার পূর্ণ আরবি টেক্সট ও ড. আবু বকর মুহাম্মাদ যাকারিয়ার বাংলা অনুবাদ, টীকাসহ।",
  alternates: { canonical: "/quran" },
};

export default async function QuranPage() {
  const surahs = await getSurahs();
  return (
    <section className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <Breadcrumbs items={[{ label: "হোম", href: "/" }, { label: "আল-কুরআন" }]} />
      <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-deep to-primary px-6 py-8 text-center text-white shadow-md">
        <p lang="ar" dir="rtl" className="font-quran text-3xl text-accent md:text-4xl">ٱلْقُرْءَانُ ٱلْكَرِيمُ</p>
        <h1 className="mt-2 text-3xl font-bold">আল-কুরআন</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-white/80">১১৪টি সূরা · ৬২৩৬টি আয়াত — আরবি মূল পাঠ ও বাংলা অর্থ, ব্যাখ্যামূলক টীকাসহ।</p>
      </div>
      <SurahList surahs={surahs} />
      <QuranSources className="mt-10" />
    </section>
  );
}
