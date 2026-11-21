import Link from "next/link";
import { SectionHeading } from "./section-heading";
import { toBnDigits } from "@/lib/utils";

export interface ArticleGroup {
  slug: string;
  name_bn: string;
  description_bn: string | null;
  count: number;
  latest: { slug: string; title: string; reading_minutes: number | null } | null;
}

export function ArticlesSection({ groups }: { groups: ArticleGroup[] }) {
  return (
    <section aria-labelledby="articles-title" className="mx-auto max-w-6xl px-4 pt-14">
      <SectionHeading id="articles-title" title="বিষয়ভিত্তিক প্রবন্ধ" href="/articles" linkLabel="সব প্রবন্ধ দেখুন" />
      <p className="mb-6 text-sm text-muted-foreground md:text-base">
        নির্ভরযোগ্য আলেমদের লেখা গবেষণাধর্মী ও সহজবোধ্য প্রবন্ধ — বিষয় বেছে নিয়ে পড়ুন।
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((c) => (
          <article key={c.slug} className="group relative flex flex-col rounded-xl border border-l-4 border-l-accent bg-card p-5 shadow-sm transition hover:shadow-md">
            <span className="text-xs font-semibold text-accent">{toBnDigits(c.count)}টি প্রবন্ধ</span>
            <h3 className="mt-1 text-lg font-bold text-primary">
              <Link href={`/articles?category=${c.slug}`} className="after:absolute after:inset-0 group-hover:underline">{c.name_bn}</Link>
            </h3>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">{c.description_bn}</p>
            {c.latest && (
              <p className="relative z-10 mt-3 border-t border-dashed pt-2 text-xs text-muted-foreground">
                সাম্প্রতিক:{" "}
                <Link href={`/articles/${c.latest.slug}`} className="font-medium text-foreground hover:text-primary hover:underline">{c.latest.title}</Link>
                {" "}· পড়তে {toBnDigits(c.latest.reading_minutes ?? 1)} মিনিট
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
