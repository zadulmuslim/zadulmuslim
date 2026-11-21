import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Breadcrumbs } from "@/components/content/breadcrumbs";
import { EditorialNote } from "@/components/content/editorial-note";
import { articlesInCategory } from "@/lib/content";
import { toBnDigits } from "@/lib/utils";

/** Landing page for an article collection (Seerah chapters, biographies). */
export async function CollectionPage({ slug, title, intro, numbered, ar }: { slug: string; title: string; intro: string; numbered?: boolean; ar?: string }) {
  const { rows } = await articlesInCategory(slug);
  return (
    <section className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      <Breadcrumbs items={[{ label: "হোম", href: "/" }, { label: title }]} />
      <div className="mb-8 rounded-2xl bg-gradient-to-br from-brand-deep to-primary px-6 py-8 text-white shadow-md">
        {ar && <p lang="ar" dir="rtl" className="font-arabic text-2xl text-accent">{ar}</p>}
        <h1 className="mt-1 text-3xl font-bold">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/80">{intro}</p>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-xl border bg-card px-4 py-10 text-center text-sm text-muted-foreground">এই অংশে লেখা শীঘ্রই প্রকাশিত হবে, ইনশাআল্লাহ।</p>
      ) : (
        <ol className={numbered ? "relative space-y-4 border-l-2 border-accent/40 pl-6" : "grid gap-4 sm:grid-cols-2"}>
          {rows.map((a, i) => (
            <li key={a.slug} className="relative">
              {numbered && (
                <span className="absolute -left-[37px] top-4 grid size-7 place-items-center rounded-full bg-primary text-xs font-bold text-white ring-4 ring-background">{toBnDigits(i + 1)}</span>
              )}
              <Link href={`/articles/${a.slug}`} className="group block h-full rounded-2xl border bg-card p-5 shadow-sm transition hover:border-accent hover:shadow-md">
                <h2 className="font-bold leading-snug group-hover:text-primary">{a.title}</h2>
                {a.excerpt && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.excerpt}</p>}
                <p className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {toBnDigits(a.reading_minutes ?? 1)} মিনিটে পড়ুন</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-primary">পড়ুন <ArrowRight className="size-3.5" /></span>
                </p>
              </Link>
            </li>
          ))}
        </ol>
      )}
      <div className="mt-8"><EditorialNote /></div>
    </section>
  );
}
