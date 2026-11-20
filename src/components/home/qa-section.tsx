import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { qaGroups, recentQuestions, topics } from "@/data/home";
import { SectionHeading } from "./section-heading";

export function QaSection() {
  return (
    <section aria-labelledby="qa-title" className="mx-auto grid max-w-6xl gap-8 px-4 pt-12 lg:grid-cols-[1fr_320px]">
      <div>
        <SectionHeading id="qa-title" title="প্রশ্নোত্তর" href="/qa" />
        <div className="grid gap-4 md:grid-cols-2">
          {qaGroups.map((group) => (
            <article key={group.slug} className="rounded-xl border border-t-4 border-t-primary bg-card p-5 shadow-sm">
              <h3 className="mb-2 font-bold text-foreground">
                <Link href={`/qa?category=${group.slug}`} className="hover:text-primary">{group.title}</Link>
              </h3>
              <ul className="divide-y divide-dashed">
                {group.questions.map((q) => (
                  <li key={q}>
                    <Link href={`/qa?q=${encodeURIComponent(q)}`} className="group flex items-start gap-2 py-2 text-sm text-foreground/85 hover:text-primary">
                      <ChevronLeft className="mt-1 size-3.5 shrink-0 rotate-180 text-accent" aria-hidden />
                      <span>{q}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>

      <aside className="space-y-4" aria-label="সাইডবার">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-3 border-b pb-2 font-bold text-primary">সাম্প্রতিক</h2>
          <ul className="divide-y">
            {recentQuestions.map((q) => (
              <li key={q.title} className="py-2.5">
                <Link href={`/qa?q=${encodeURIComponent(q.title)}`} className="text-sm hover:text-primary">{q.title}</Link>
                <p className="text-xs text-muted-foreground">{q.date}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-3 font-bold text-primary">বিষয়সূচি</h2>
          <ul className="flex flex-wrap gap-2">
            {topics.map((t) => (
              <li key={t.slug}>
                <Link href={`/qa?category=${t.slug}`} className="inline-block rounded-full border bg-secondary px-3 py-1 text-xs hover:border-accent hover:text-primary">
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </section>
  );
}
