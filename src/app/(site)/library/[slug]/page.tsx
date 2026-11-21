import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Download } from "lucide-react";
import { Breadcrumbs } from "@/components/content/breadcrumbs";
import { ShareButtons } from "@/components/content/share-buttons";
import { getBook } from "@/lib/library";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const b = await getBook(decodeURIComponent((await params).slug));
  if (!b) return {};
  return { title: `${b.title}${b.author_name ? ` — ${b.author_name}` : ""}`, description: b.description?.slice(0, 160) ?? undefined, alternates: { canonical: `/library/${b.slug}` } };
}

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const b = await getBook(decodeURIComponent((await params).slug));
  if (!b) notFound();
  const isPdf = b.file?.mime === "application/pdf";
  return (
    <article className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      <Breadcrumbs items={[{ label: "হোম", href: "/" }, { label: "লাইব্রেরি", href: "/library" }, { label: b.title }]} />
      <div className="grid gap-8 md:grid-cols-[260px_minmax(0,1fr)]">
        <div className="mx-auto aspect-[3/4] w-56 overflow-hidden rounded-xl border bg-gradient-to-br from-brand-deep to-primary shadow-md md:w-full">
          {b.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.cover.url} alt={`${b.title} — প্রচ্ছদ`} className="size-full object-cover" />
          ) : (
            <span className="grid size-full place-items-center p-4 text-center font-bold text-white"><BookOpen className="mb-2 size-10 text-accent" />{b.title}</span>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-primary md:text-3xl">{b.title}</h1>
          <dl className="mt-3 space-y-1 text-sm">
            {b.author_name && <div className="flex gap-2"><dt className="text-muted-foreground">লেখক:</dt><dd className="font-medium">{b.author_name}</dd></div>}
            {b.subject && <div className="flex gap-2"><dt className="text-muted-foreground">বিষয়:</dt><dd><Link href={`/library?subject=${encodeURIComponent(b.subject)}`} className="font-medium text-primary hover:underline">{b.subject}</Link></dd></div>}
          </dl>
          {b.file && (
            <div className="mt-5 flex flex-wrap gap-2">
              {isPdf && <a href={b.file.url} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90"><BookOpen className="size-4" /> অনলাইনে পড়ুন</a>}
              <a href={b.file.url} download className="inline-flex h-11 items-center gap-2 rounded-full border border-primary/30 px-5 text-sm font-semibold text-primary hover:bg-primary/5"><Download className="size-4" /> ডাউনলোড</a>
            </div>
          )}
          {b.description && <p className="mt-6 whitespace-pre-line leading-relaxed">{b.description}</p>}
          <div className="mt-6"><ShareButtons title={b.title} /></div>
        </div>
      </div>
    </article>
  );
}
