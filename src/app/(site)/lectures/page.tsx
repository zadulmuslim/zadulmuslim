import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/content/breadcrumbs";
import { LectureCard } from "@/components/content/lecture-card";
import { KIND_LABEL, listLectures, type LectureKind } from "@/lib/library";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "বয়ান ও ভিডিও",
  description: "নির্ভরযোগ্য আলেমদের বয়ান, দরস, হামদ ও নাত — ভিডিও ও অডিও।",
  alternates: { canonical: "/lectures" },
};

export default async function LecturesPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const k = (await searchParams).kind;
  const kind = (["video", "audio", "nasheed"] as const).find((x) => x === k) as LectureKind | undefined;
  const rows = await listLectures(kind);
  return (
    <section className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <Breadcrumbs items={[{ label: "হোম", href: "/" }, { label: "বয়ান ও ভিডিও" }]} />
      <h1 className="text-3xl font-bold text-primary">বয়ান ও ভিডিও</h1>
      <p className="mb-6 mt-1 text-muted-foreground">নির্ভরযোগ্য আলেমদের বয়ান, দরস, হামদ ও নাত।</p>
      <nav className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4" aria-label="ধরন">
        {[["", "সব"] as const, ...(Object.entries(KIND_LABEL) as [LectureKind, string][])].map(([v, l]) => (
          <Link key={v} href={v ? `/lectures?kind=${v}` : "/lectures"} className={cn("whitespace-nowrap rounded-full border px-4 py-1.5 text-sm", (kind ?? "") === v ? "border-primary bg-primary font-semibold text-white" : "bg-card hover:border-accent")}>{l}</Link>
        ))}
      </nav>
      {rows.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{rows.map((l) => <LectureCard key={l.id} l={l} />)}</div>
      ) : (
        <p className="rounded-xl border bg-card px-4 py-12 text-center text-sm text-muted-foreground">বয়ান সংকলনের কাজ চলছে — ইনশাআল্লাহ শীঘ্রই প্রকাশিত হবে।</p>
      )}
    </section>
  );
}
