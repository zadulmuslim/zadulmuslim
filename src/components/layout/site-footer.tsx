import Link from "next/link";
import { ArrowLeft, Mail, MapPin, MessageCircleQuestion } from "lucide-react";
import { footerColumns, legalLinks, siteConfig } from "@/config/site";
import { HijriDate } from "./hijri-date";
import { BackToTop } from "./back-to-top";

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-brand-deep text-white/85">
      {/* Call to action */}
      <div className="border-y-4 border-accent bg-primary/40">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-brand-deep">
              <MessageCircleQuestion className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-lg font-bold text-white">শরয়ী কোনো বিষয়ে জানতে চান?</p>
              <p className="text-sm text-white/75">নাম গোপন রেখে প্রশ্ন পাঠান — আলেমগণ কুরআন-সুন্নাহর আলোকে উত্তর দেবেন।</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/ask" className="inline-flex h-11 items-center rounded-full bg-accent px-6 text-sm font-bold text-brand-deep hover:bg-accent/90">প্রশ্ন করুন</Link>
            <Link href="/qa" className="inline-flex h-11 items-center gap-1 rounded-full border border-white/30 px-5 text-sm font-semibold text-white hover:border-accent">
              প্রশ্নোত্তর দেখুন <ArrowLeft className="size-4 rotate-180" aria-hidden />
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-11 place-items-center rounded-full bg-accent text-xl text-brand-deep" aria-hidden>☪</span>
            <span>
              <span className="block text-xl font-bold text-white">{siteConfig.nameBn}</span>
              <span className="block text-xs text-accent">{siteConfig.associatedPlatforms.join(" · ")}</span>
            </span>
          </Link>
          <p className="mt-4 text-sm font-semibold text-accent">{siteConfig.tagline}</p>
          <p className="mt-2 text-sm leading-relaxed text-white/75">{siteConfig.footerAbout} {siteConfig.description}</p>
          <ul className="mt-5 space-y-2 text-sm">
            <li>
              <a href={`mailto:${siteConfig.contact.email}`} className="inline-flex items-center gap-2 hover:text-white hover:underline">
                <Mail className="size-4 text-accent" aria-hidden />
                <span dir="ltr">{siteConfig.contact.email}</span>
              </a>
            </li>
            <li className="flex items-center gap-2"><MapPin className="size-4 text-accent" aria-hidden />{siteConfig.contact.location}</li>
          </ul>
        </div>

        {footerColumns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="mb-3 font-bold text-accent">{col.title}</h2>
            <ul className="space-y-2 text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/80 transition-colors hover:text-white hover:underline">{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs leading-relaxed text-white/70">
          <strong className="text-white/90">বিশেষ দ্রষ্টব্য:</strong> এখানে প্রকাশিত প্রশ্নোত্তর ও প্রবন্ধ সাধারণ দিকনির্দেশনার জন্য। ব্যক্তিগত বা জটিল বিষয়ে সিদ্ধান্ত নেওয়ার আগে নির্ভরযোগ্য স্থানীয় মুফতি বা আলেমের পরামর্শ নিন।
        </p>
      </div>

      <div className="mt-8 border-t border-white/15">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-5 text-xs text-white/70 md:flex-row md:justify-between">
          <div className="text-center md:text-left">
            <p>© {siteConfig.copyrightYear} {siteConfig.nameBn}। সর্বস্বত্ব সংরক্ষিত।</p>
            <HijriDate className="mt-1 text-white/60" />
          </div>
          <nav aria-label="নীতিমালা" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {legalLinks.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-white hover:underline">{l.label}</Link>
            ))}
            <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-white hover:underline">যোগাযোগ</a>
            <BackToTop />
          </nav>
        </div>
      </div>
    </footer>
  );
}
