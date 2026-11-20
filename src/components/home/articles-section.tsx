import Link from "next/link";
import { articleCategories } from "@/data/home";
import { SectionHeading } from "./section-heading";

export function ArticlesSection() {
  return (
    <section aria-labelledby="articles-title" className="mx-auto max-w-6xl px-4 pt-14">
      <SectionHeading id="articles-title" title="বিষয়ভিত্তিক প্রবন্ধ" href="/articles" linkLabel="সব প্রবন্ধ দেখুন" />
      <p className="mb-6 text-sm text-muted-foreground md:text-base">
        নির্ভরযোগ্য আলেমদের লেখা গবেষণাধর্মী ও সহজবোধ্য প্রবন্ধ — বিষয় বেছে নিয়ে পড়ুন।
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articleCategories.map((c) => (
          <Link
            key={c.slug}
            href={`/articles?category=${c.slug}`}
            className="group flex flex-col rounded-xl border border-l-4 border-l-accent bg-card p-5 shadow-sm transition hover:shadow-md"
          >
            <span className="text-xs font-semibold text-accent">{c.count} প্রবন্ধ</span>
            <h3 className="mt-1 text-lg font-bold text-primary group-hover:underline">{c.title}</h3>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">{c.description}</p>
            <p className="mt-3 border-t border-dashed pt-2 text-xs text-muted-foreground">
              সাম্প্রতিক: {c.latest} · পড়তে {c.minutes} মিনিট
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
