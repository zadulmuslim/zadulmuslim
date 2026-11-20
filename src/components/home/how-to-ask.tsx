import { askSteps, stats } from "@/data/home";
import { toBnDigits } from "@/lib/utils";
import { SectionHeading } from "./section-heading";

export function HowToAsk() {
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
      <dl className="grid h-fit grid-cols-2 gap-px self-center overflow-hidden rounded-xl border bg-border shadow-sm">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col bg-card p-6 text-center">
            <dt className="order-2 text-sm text-muted-foreground">{s.label}</dt>
            <dd className="text-2xl font-bold text-primary md:text-3xl">{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
