import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/content/breadcrumbs";
import { SearchExperience } from "@/components/search/search-experience";

export const metadata: Metadata = { title: "অনুসন্ধান", robots: { index: false, follow: true } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:py-10">
      <Breadcrumbs items={[{ label: "হোম", href: "/" }, { label: "অনুসন্ধান" }]} />
      <h1 className="mb-4 text-2xl font-bold text-primary">অনুসন্ধান</h1>
      <SearchExperience initialQ={(sp.q ?? "").slice(0, 100)} initialType={sp.type ?? "all"} />
    </div>
  );
}
