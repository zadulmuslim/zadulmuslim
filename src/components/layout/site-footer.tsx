import Link from "next/link";
import { Mail, MapPin, MessageCircleQuestion } from "lucide-react";
import { developer, footerColumns, legalLinks, siteConfig } from "@/config/site";
import { HijriDate } from "./hijri-date";
import { BackToTop } from "./back-to-top";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t-[3px] border-accent bg-brand-deep text-white/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-10 pt-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        {/* Brand */}
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-full bg-accent text-xl text-brand-deep" aria-hidden>☪</span>
            <span>
              <span className="block text-xl font-bold leading-tight text-white">{siteConfig.nameBn}</span>
              <span className="block text-xs text-accent">{siteConfig.associatedPlatforms.join(" · ")}</span>
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">{siteConfig.footerAbout} কুরআন, হাদীস, প্রশ্নোত্তর ও দৈনন্দিন আমলের নির্ভরযোগ্য ঠিকানা।</p>
          <ul className="mt-5 space-y-2 text-sm">
            <li>
              <a href={`mailto:${siteConfig.contact.email}`} className="inline-flex items-center gap-2 hover:text-white">
                <Mail className="size-4 text-accent" aria-hidden />
                <span dir="ltr">{siteConfig.contact.email}</span>
              </a>
            </li>
            <li className="flex items-center gap-2"><MapPin className="size-4 text-accent" aria-hidden />{siteConfig.contact.location}</li>
          </ul>
          <Link
            href="/ask"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-accent/60 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent hover:text-brand-deep"
          >
            <MessageCircleQuestion className="size-4" aria-hidden /> আলেমদের কাছে প্রশ্ন করুন
          </Link>
        </div>

        {footerColumns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">{col.title}</h2>
            <ul className="space-y-2.5 text-sm">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-white/70 transition-colors hover:text-accent">{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <p className="border-t border-white/10 py-5 text-xs leading-relaxed text-white/55">
          এখানে প্রকাশিত প্রশ্নোত্তর ও প্রবন্ধ সাধারণ দিকনির্দেশনার জন্য। ব্যক্তিগত বা জটিল বিষয়ে সিদ্ধান্ত নেওয়ার আগে নির্ভরযোগ্য স্থানীয় মুফতি বা আলেমের পরামর্শ নিন।
        </p>
      </div>

      <div className="bg-black/20">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-4 text-xs text-white/60 md:flex-row md:justify-between">
          <div className="text-center md:text-left">
            <p>© {siteConfig.copyrightYear} {siteConfig.nameBn}। সর্বস্বত্ব সংরক্ষিত।</p>
            <HijriDate className="mt-0.5 text-white/45" />
            <p className="mt-1.5 text-white/55">
              Developed by{" "}
              <a href={developer.url} target="_blank" rel="noopener" className="font-semibold text-accent hover:text-white hover:underline">
                {developer.name}
              </a>
            </p>
          </div>
          <nav aria-label="নীতিমালা" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {legalLinks.map((l) => (
              <Link key={l.label} href={l.href} className="hover:text-white">{l.label}</Link>
            ))}
            <BackToTop />
          </nav>
        </div>
      </div>
    </footer>
  );
}
