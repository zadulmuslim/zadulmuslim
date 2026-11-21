import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Breadcrumbs } from "@/components/content/breadcrumbs";
import { bookSubjects, listBooks } from "@/lib/library";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "লাইব্রেরি — ইসলামী বই",
  description: "বিষয়ভিত্তিক ইসলামী বই — অনলাইনে পড়ুন ও ডাউনলোড করুন।",
  alternates: { canonical: "/library" },
};

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  const subject = (await searchParams).subject?.slice(0, 80);
  const [books, subjects] = await Promise.all([listBooks(subject), bookSubjects()]);
  return (
    <section className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <Breadcrumbs items={[{ label: "হোম", href: "/" }, { label: "লাইব্রেরি" }]} />
      <h1 className="text-3xl font-bold text-primary">লাইব্রেরি</h1>
      <p className="mb-6 mt-1 text-muted-foreground">বিষয়ভিত্তিক ইসলামী বই — অনলাইনে পড়ুন বা ডাউনলোড করুন।</p>
      {subjects.length > 0 && (
        <nav className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4" aria-label="বিষয়">
          {["", ...subjects].map((s) => (
            <Link key={s || "all"} href={s ? `/library?subject=${encodeURIComponent(s)}` : "/library"} className={cn("whitespace-nowrap rounded-full border px-4 py-1.5 text-sm", (subject ?? "") === s ? "border-primary bg-primary font-semibold text-white" : "bg-card hover:border-accent")}>{s || "সব বই"}</Link>
          ))}
        </nav>
      )}
      {books.length ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {books.map((b) => (
            <li key={b.id}>
              <Link href={`/library/${b.slug}`} className="group block">
                <div className="aspect-[3/4] overflow-hidden rounded-lg border bg-gradient-to-br from-brand-deep to-primary shadow-sm transition group-hover:shadow-md">
                  {b.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.cover} alt="" loading="lazy" className="size-full object-cover" />
                  ) : (
                    <span className="grid size-full place-items-center p-3 text-center text-sm font-semibold text-white"><BookOpen className="mb-2 size-8 text-accent" />{b.title}</span>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug group-hover:text-primary">{b.title}</p>
                {b.author_name && <p className="text-xs text-muted-foreground">{b.author_name}</p>}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border bg-card px-4 py-12 text-center text-sm text-muted-foreground">বই সংকলনের কাজ চলছে — ইনশাআল্লাহ শীঘ্রই প্রকাশিত হবে।</p>
      )}
    </section>
  );
}
