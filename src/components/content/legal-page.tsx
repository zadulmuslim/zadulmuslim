import Link from "next/link";
import { CheckCircle2, FileText, ListOrdered, Mail, ShieldCheck } from "lucide-react";
import { PageHero } from "./page-hero";
import { siteConfig } from "@/config/site";
import { toBnDigits } from "@/lib/utils";

export interface LegalSection { id: string; heading: string; body: React.ReactNode }

const RELATED = [
  { href: "/privacy", label: "গোপনীয়তা নীতি", icon: ShieldCheck },
  { href: "/terms", label: "ব্যবহারের শর্তাবলি", icon: FileText },
  { href: "/contact", label: "যোগাযোগ", icon: Mail },
];

/** Policy page: hero, key points, table of contents and numbered sections. */
export function LegalPage({
  title, updated, intro, summary, sections, path,
}: { title: string; updated: string; intro: string; summary?: string[]; sections: LegalSection[]; path: string }) {
  const toc = (
    <ol className="space-y-1 text-sm">
      {sections.map((s, i) => (
        <li key={s.id}>
          <a href={`#${s.id}`} className="flex gap-2 rounded-lg px-2 py-1.5 text-muted-foreground transition hover:bg-muted hover:text-primary">
            <span className="w-5 shrink-0 text-right tabular-nums">{toBnDigits(i + 1)}.</span>
            {s.heading}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      <PageHero crumb={title} title={title} subtitle={intro}>
        <p className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs text-white/85">সর্বশেষ হালনাগাদ: {updated}</p>
      </PageHero>

      <div className="mx-auto grid max-w-6xl gap-4 px-4 pb-16 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
        <aside className="-mt-8 lg:mt-0 lg:pt-10">
          <div className="flex flex-col gap-4 lg:sticky lg:top-24">
            <details className="rounded-2xl border bg-card p-4 shadow-md lg:hidden">
              <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold"><ListOrdered className="size-4 text-primary" />সূচিপত্র</summary>
              <div className="mt-3">{toc}</div>
            </details>
            <nav aria-label="সূচিপত্র" className="hidden rounded-2xl border bg-card p-4 shadow-sm lg:block">
              <p className="mb-2 flex items-center gap-2 px-2 text-sm font-bold"><ListOrdered className="size-4 text-primary" />সূচিপত্র</p>
              {toc}
            </nav>
            <ul className="hidden space-y-1 rounded-2xl border bg-card p-3 text-sm shadow-sm lg:block">
              {RELATED.filter((r) => r.href !== path).map(({ href, label, icon: Icon }) => (
                <li key={href}><Link href={href} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted hover:text-primary"><Icon className="size-4 text-primary" />{label}</Link></li>
              ))}
            </ul>
          </div>
        </aside>

        <article className="min-w-0 lg:pt-10">
          {summary && summary.length > 0 && (
            <div className="rounded-3xl border border-accent/40 bg-card p-5 shadow-sm md:p-6">
              <h2 className="font-bold text-primary">সংক্ষেপে</h2>
              <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {summary.map((s) => (
                  <li key={s} className="flex gap-2 text-sm leading-relaxed"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />{s}</li>
                ))}
              </ul>
            </div>
          )}

          <ol className="mt-4 space-y-4">
            {sections.map((s, i) => (
              <li key={s.id} id={s.id} className="scroll-mt-24 rounded-2xl border bg-card p-5 shadow-sm md:p-6">
                <h2 className="mb-3 flex items-baseline gap-2 text-lg font-bold text-primary">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-sm tabular-nums">{toBnDigits(i + 1)}</span>
                  {s.heading}
                </h2>
                <div className="space-y-3 leading-relaxed text-foreground/90 [&_li]:leading-relaxed [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">{s.body}</div>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-col items-start justify-between gap-3 rounded-2xl bg-secondary/50 p-5 sm:flex-row sm:items-center">
            <p className="text-sm">এই বিষয়ে কোনো প্রশ্ন বা অনুরোধ আছে?</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/contact" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-deep">যোগাযোগ করুন</Link>
              <a href={`mailto:${siteConfig.contact.email}`} className="rounded-full border bg-card px-4 py-2 text-sm font-semibold hover:border-accent" dir="ltr">{siteConfig.contact.email}</a>
            </div>
          </div>
        </article>
      </div>
    </>
  );
}
