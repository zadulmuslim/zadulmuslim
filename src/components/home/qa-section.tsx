import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { SectionHeading } from "./section-heading";
import { formatBnDate } from "@/lib/format";

export interface QaGroup {
  title: string;
  slug: string;
  questions: { title: string; slug: string }[];
}

export function QaSection({
  groups,
  recent,
  topics,
}: {
  groups: QaGroup[];
  recent: { title: string; slug: string; published_at: string | null }[];
  topics: { name_bn: string; slug: string }[];
}) {
  return (
    <section aria-labelledby="qa-title" className="mx-auto grid max-w-6xl gap-8 px-4 pt-12 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div>
        <SectionHeading id="qa-title" title="প্রশ্নোত্তর" href="/qa" />
        {groups.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {groups.map((group) => (
              <article key={group.slug} className="rounded-xl border border-t-4 border-t-primary bg-card p-5 shadow-sm">
                <h3 className="mb-2 font-bold text-foreground">
                  <Link href={`/qa?category=${group.slug}`} className="hover:text-primary">{group.title}</Link>
                </h3>
                <ul className="divide-y divide-dashed">
                  {group.questions.map((q) => (
                    <li key={q.slug}>
                      <Link href={`/qa/${q.slug}`} className="group flex items-start gap-2 py-2 text-sm text-foreground/85 hover:text-primary">
                        <ChevronLeft className="mt-1 size-3.5 shrink-0 rotate-180 text-accent" aria-hidden />
                        <span>{q.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border bg-card px-5 py-10 text-center text-sm text-muted-foreground">শীঘ্রই প্রশ্নোত্তর প্রকাশিত হবে, ইনশাআল্লাহ।</p>
        )}
      </div>

      <aside className="space-y-4" aria-label="সাইডবার">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-3 border-b pb-2 font-bold text-primary">সাম্প্রতিক</h2>
          <ul className="divide-y">
            {recent.map((q) => (
              <li key={q.slug} className="py-2.5">
                <Link href={`/qa/${q.slug}`} className="text-sm hover:text-primary">{q.title}</Link>
                <p className="text-xs text-muted-foreground">{formatBnDate(q.published_at)}</p>
              </li>
            ))}
            {!recent.length && <li className="py-2 text-sm text-muted-foreground">এখনো কিছু প্রকাশিত হয়নি।</li>}
          </ul>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-3 font-bold text-primary">বিষয়সূচি</h2>
          <ul className="flex flex-wrap gap-2">
            {topics.map((t) => (
              <li key={t.slug}>
                <Link href={`/qa?category=${t.slug}`} className="inline-block rounded-full border bg-secondary px-3 py-1 text-xs hover:border-accent hover:text-primary">
                  {t.name_bn}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </section>
  );
}
