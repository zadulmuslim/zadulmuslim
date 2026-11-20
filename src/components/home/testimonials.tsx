import { testimonials } from "@/data/home";
import { SectionHeading } from "./section-heading";

export function Testimonials() {
  return (
    <section aria-labelledby="testimonials-title" className="mx-auto max-w-6xl px-4 pt-14">
      <SectionHeading id="testimonials-title" title="পাঠকদের অভিজ্ঞতা" />
      <div className="grid gap-4 md:grid-cols-2">
        {testimonials.map((t) => (
          <figure key={t.name} className="rounded-xl border bg-card p-6 shadow-sm">
            <blockquote className="text-sm leading-relaxed">“{t.quote}”</blockquote>
            <figcaption className="mt-3 text-sm font-semibold text-primary">— {t.name}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
