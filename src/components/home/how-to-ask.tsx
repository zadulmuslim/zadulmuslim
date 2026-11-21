import { askSteps } from "@/data/home";
import { toBnDigits } from "@/lib/utils";
import { SectionHeading } from "./section-heading";

export interface SiteStats { questions: number; articles: number; questionTopics: number; articleTopics: number }

/** "How to ask" steps plus live content statistics from the database. */
export function HowToAsk({ stats }: { stats: SiteStats | null }) {
  const items = stats
    ? [
        { value: stats.questions, label: "প্রকাশিত প্রশ্নোত্তর" },
        { value: stats.articles, label: "প্রবন্ধ" },
        { value: stats.questionTopics, label: "মাসআলার বিষয়" },
        { value: stats.articleTopics, label: "প্রবন্ধের বিষয়" },
      ]
    : [];
  return (
    <section aria-labelledby="how-title" className="mx-auto grid max-w-6xl gap-8 px-4 pt-14 lg:grid-cols-2">
      <div>
        <SectionHeading id="how-title" title="কীভাবে প্রশ্ন করবেন" />
        <ol className="space-y-4">
          {askSteps.map((step, i) => (
            <li key={step.title} className="relative rounded-xl border bg-card p-5 pl-16 shadow-sm">
              <span className="absolute left-5 top-5 grid size-8 place-items-center rounded-full bg-primary text-sm font-bold text-white">
                {toBnDigits(i + 1)}
              </span>
              <h3 className="font-bold text-primary">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
      {items.length > 0 && (
        <div className="self-center">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border shadow-sm">
            {items.map((s) => (
              <div key={s.label} className="flex flex-col bg-card p-6 text-center">
                <dt className="order-2 text-sm text-muted-foreground">{s.label}</dt>
                <dd className="text-2xl font-bold text-primary md:text-3xl">{toBnDigits(s.value)}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-center text-xs text-muted-foreground">নতুন প্রশ্নোত্তর ও প্রবন্ধ নিয়মিত যুক্ত হচ্ছে, ইনশাআল্লাহ।</p>
        </div>
      )}
    </section>
  );
}
