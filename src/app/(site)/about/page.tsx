import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, BookMarked, CheckCircle2, Clock, FileText, HandCoins, HeartHandshake, Library, MessageCircleQuestion, PlayCircle, ScrollText, Search, ShieldCheck, Sparkles, Users } from "lucide-react";
import { PageHero } from "@/components/content/page-hero";
import { publicDb } from "@/lib/supabase/public";
import { getSources } from "@/lib/quran";
import { siteConfig } from "@/config/site";
import { toBnDigits } from "@/lib/utils";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "আমাদের সম্পর্কে",
  description: "যাদুল মুসলিম — কুরআন, হাদীস, প্রশ্নোত্তর ও দৈনন্দিন আমলের নির্ভরযোগ্য বাংলা প্ল্যাটফর্ম। আমাদের লক্ষ্য, কাজের পদ্ধতি ও তথ্যসূত্র।",
  alternates: { canonical: "/about" },
};

async function counts() {
  const db = publicDb();
  if (!db) return null;
  const head = { count: "exact" as const, head: true };
  const [ayahs, hadiths, qa, articles, lectures, books] = await Promise.all([
    db.from("quran_ayahs").select("surah", head),
    db.from("hadiths").select("id", head),
    db.from("questions").select("id", head).eq("status", "answered").eq("is_public", true),
    db.from("articles").select("id", head).eq("status", "published"),
    db.from("lectures").select("id", head).eq("status", "published"),
    db.from("books").select("id", head).eq("status", "published"),
  ]);
  return { ayahs: ayahs.count ?? 0, hadiths: hadiths.count ?? 0, qa: qa.count ?? 0, articles: articles.count ?? 0, lectures: lectures.count ?? 0, books: books.count ?? 0 };
}

const OFFER = [
  { href: "/quran", icon: BookOpen, title: "আল-কুরআন", text: "আরবি মূল পাঠ ও প্রাঞ্জল বাংলা অনুবাদ, আয়াত ধরে সার্চ ও শেয়ার।" },
  { href: "/hadith", icon: ScrollText, title: "হাদীস", text: "মান নির্ণয় ও ব্যাখ্যাসহ বাছাইকৃত হাদীস, বিষয়ভিত্তিক সাজানো।" },
  { href: "/qa", icon: MessageCircleQuestion, title: "প্রশ্নোত্তর", text: "দৈনন্দিন জীবনের মাসআলা — আলেমগণের যাচাইকৃত উত্তর।" },
  { href: "/articles", icon: FileText, title: "প্রবন্ধ", text: "গবেষণাধর্মী ও সহজবোধ্য লেখা — আকিদা, ইবাদত, পরিবার ও সমাজ।" },
  { href: "/prayer-times", icon: Clock, title: "নামাজের সময়", text: "৬৪ জেলার নির্ভুল সময়সূচি, সাহরি-ইফতার ও মাসিক তালিকা।" },
  { href: "/zakat", icon: HandCoins, title: "যাকাত হিসাব", text: "সম্পদ লিখলেই নিসাব যাচাই ও যাকাতের পরিমাণ।" },
  { href: "/lectures", icon: PlayCircle, title: "বয়ান", text: "নির্ভরযোগ্য আলেমদের অডিও-ভিডিও আলোচনা।" },
  { href: "/library", icon: Library, title: "লাইব্রেরি", text: "দ্বীনি বই পড়া ও ডাউনলোডের সংগ্রহশালা।" },
];

const METHOD = [
  { icon: BookMarked, title: "কুরআন ও সুন্নাহ প্রথম", text: "প্রতিটি উত্তর ও লেখার ভিত্তি কুরআন, সহীহ হাদীস এবং স্বীকৃত ফিকহী গ্রন্থ।" },
  { icon: ShieldCheck, title: "যাচাই করে প্রকাশ", text: "প্রশ্নোত্তর ও প্রবন্ধ প্রকাশের আগে সম্পাদকীয়ভাবে পর্যালোচনা করা হয় এবং সূত্র উল্লেখ করা হয়।" },
  { icon: Sparkles, title: "সহজ ও প্রাঞ্জল ভাষা", text: "জটিল বিষয়ও সাধারণ পাঠকের বোধগম্য বাংলায় উপস্থাপনের চেষ্টা।" },
  { icon: HeartHandshake, title: "ভুল স্বীকার ও সংশোধন", text: "কোনো ভুল ধরিয়ে দিলে যাচাই করে দ্রুত সংশোধন করা হয়।" },
];

export default async function AboutPage() {
  const [c, sources] = await Promise.all([counts(), getSources()]);
  const stats = c
    ? [
        { label: "কুরআনের আয়াত", value: c.ayahs },
        { label: "হাদীস", value: c.hadiths },
        { label: "প্রশ্নোত্তর", value: c.qa },
        { label: "প্রবন্ধ", value: c.articles },
        ...(c.lectures ? [{ label: "বয়ান", value: c.lectures }] : []),
        ...(c.books ? [{ label: "বই", value: c.books }] : []),
      ]
    : [];

  return (
    <>
      <PageHero crumb="আমাদের সম্পর্কে" title="আমাদের সম্পর্কে" subtitle={`${siteConfig.nameBn} — কুরআন, হাদীস, প্রশ্নোত্তর ও দৈনন্দিন আমলের নির্ভরযোগ্য বাংলা ঠিকানা। ${siteConfig.footerAbout}`}>
        <p className="mt-4 text-sm text-accent">{siteConfig.associatedPlatforms.join(" · ")}</p>
      </PageHero>

      <div className="mx-auto max-w-6xl px-4 pb-16">
        {stats.length > 0 && (
          <ul className="-mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {stats.map((s) => (
              <li key={s.label} className="rounded-2xl border bg-card p-4 text-center shadow-sm">
                <p className="text-2xl font-bold tabular-nums text-primary">{toBnDigits(s.value.toLocaleString("en-US"))}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </li>
            ))}
          </ul>
        )}

        {/* Name and mission */}
        <section className="mt-12 grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-2xl font-bold text-primary">“যাদুল মুসলিম” নামের অর্থ</h2>
            <p className="mt-3 leading-relaxed">
              আরবি <strong>“যাদ” (زاد)</strong> অর্থ পাথেয় — সফরের প্রয়োজনীয় সম্বল। “যাদুল মুসলিম” মানে মুসলিমের পাথেয়। দুনিয়ার এই সফরে একজন মুসলিমের সবচেয়ে বড় সম্বল হলো সঠিক ইলম ও তাকওয়া। সেই ইলমকে নির্ভরযোগ্য সূত্রে, সহজ বাংলায় সবার হাতের কাছে পৌঁছে দেওয়াই আমাদের লক্ষ্য।
            </p>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              আমরা চাই — একজন পাঠক নামাজের সময় দেখা থেকে শুরু করে কুরআন তিলাওয়াত, হাদীস অধ্যয়ন, দৈনন্দিন মাসআলা জানা ও যাকাত হিসাব — সবকিছু এক জায়গায়, বিজ্ঞাপনের বিরক্তি ছাড়াই পান।
            </p>
          </div>
          <figure className="rounded-3xl border bg-card p-6 text-center shadow-sm md:p-8">
            <p className="font-arabic text-2xl leading-loose text-primary md:text-3xl" dir="rtl" lang="ar">وَتَزَوَّدُوا فَإِنَّ خَيْرَ الزَّادِ التَّقْوَىٰ</p>
            <figcaption className="mt-3 text-sm leading-relaxed text-muted-foreground">
              “আর তোমরা পাথেয় সংগ্রহ করো; নিশ্চয়ই সর্বোত্তম পাথেয় হলো তাকওয়া।”
              <br />
              <Link href="/quran/2#a-197" className="font-semibold text-primary hover:underline">— সূরা আল-বাকারা, আয়াত ১৯৭</Link>
            </figcaption>
          </figure>
        </section>

        {/* What we offer */}
        <section className="mt-14">
          <h2 className="text-2xl font-bold text-primary">এখানে যা পাবেন</h2>
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {OFFER.map(({ href, icon: Icon, title, text }) => (
              <li key={href}>
                <Link href={href} className="group flex h-full flex-col rounded-2xl border bg-card p-4 shadow-sm sm:p-5 transition hover:-translate-y-0.5 hover:border-accent hover:shadow-md">
                  <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white"><Icon className="size-5" aria-hidden /></span>
                  <h3 className="mt-3 font-bold">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Method */}
        <section className="mt-14 rounded-3xl bg-secondary/50 p-6 md:p-10">
          <h2 className="text-2xl font-bold text-primary">আমাদের কাজের পদ্ধতি</h2>
          <ul className="mt-6 grid gap-5 md:grid-cols-2">
            {METHOD.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-card text-accent shadow-sm"><Icon className="size-5" aria-hidden /></span>
                <div>
                  <h3 className="font-bold">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 rounded-2xl border border-accent/40 bg-card p-4 text-sm leading-relaxed">
            <strong>বিশেষ দ্রষ্টব্য:</strong> এখানে প্রকাশিত প্রশ্নোত্তর ও প্রবন্ধ সাধারণ দিকনির্দেশনা। ব্যক্তিগত, পারিবারিক বা আর্থিক জটিল বিষয়ে চূড়ান্ত সিদ্ধান্তের আগে সরাসরি নির্ভরযোগ্য মুফতি বা আলেমের পরামর্শ নিন।
          </p>
        </section>

        {/* Sources */}
        {sources.length > 0 && (
          <section className="mt-14">
            <h2 className="text-2xl font-bold text-primary">তথ্যসূত্র ও কৃতজ্ঞতা</h2>
            <p className="mt-2 text-sm text-muted-foreground">কুরআন ও হাদীসের পাঠ নিচের নির্ভরযোগ্য উৎস থেকে তাদের শর্ত মেনে অপরিবর্তিতভাবে নেওয়া হয়েছে।</p>
            <ul className="mt-5 grid gap-4 md:grid-cols-3">
              {sources.map((s) => (
                <li key={s.key} className="rounded-2xl border bg-card p-5 shadow-sm">
                  <h3 className="font-bold">{s.title_bn}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.attribution}</p>
                  {s.url && <a href={s.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline" dir="ltr">{s.url.replace(/^https?:\/\//, "")}</a>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Get involved */}
        <section className="hero-pattern mt-14 overflow-hidden rounded-3xl p-8 text-center text-white md:p-12">
          <Users className="mx-auto size-8 text-accent" aria-hidden />
          <h2 className="mt-3 text-2xl font-bold">এই কাজে আপনিও অংশ নিন</h2>
          <p className="mx-auto mt-2 max-w-xl text-white/85">প্রশ্ন করুন, উপকারী লেখা শেয়ার করুন, ভুল চোখে পড়লে জানান — প্রতিটি অংশগ্রহণ অন্যদের জন্য সদকায়ে জারিয়া হতে পারে।</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/ask" className="rounded-full bg-accent px-6 py-2.5 font-semibold text-brand-deep hover:bg-accent/90">প্রশ্ন করুন</Link>
            <Link href="/contact" className="rounded-full border border-white/40 px-6 py-2.5 font-semibold hover:bg-white/10">যোগাযোগ করুন</Link>
            <Link href="/search" className="inline-flex items-center gap-1.5 rounded-full border border-white/40 px-6 py-2.5 font-semibold hover:bg-white/10"><Search className="size-4" />খুঁজুন</Link>
          </div>
          <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-white/70"><CheckCircle2 className="size-3.5" />বিজ্ঞাপনমুক্ত · নিবন্ধন ছাড়াই পড়া যায়</p>
        </section>
      </div>
    </>
  );
}
