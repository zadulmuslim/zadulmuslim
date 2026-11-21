import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/content/breadcrumbs";
import { PrayerTimesTool } from "@/components/tools/prayer-times";
import { DISTRICTS } from "@/data/districts";

export const metadata: Metadata = {
  title: "নামাজের সময়সূচি — বাংলাদেশের ৬৪ জেলা",
  description: "বাংলাদেশের ৬৪ জেলার আজকের নামাজের সময়, সাহরি-ইফতার, নিষিদ্ধ সময় ও মাসিক সময়সূচি (হানাফী আসর)।",
  alternates: { canonical: "/prayer-times" },
};

export default async function PrayerTimesPage({ searchParams }: { searchParams: Promise<{ district?: string }> }) {
  const { district } = await searchParams;
  const valid = district && DISTRICTS.some((d) => d.slug === district) ? district : undefined;
  return (
    <section className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      <Breadcrumbs items={[{ label: "হোম", href: "/" }, { label: "নামাজের সময়" }]} />
      <h1 className="text-3xl font-bold text-primary">নামাজের সময়সূচি</h1>
      <p className="mb-6 mt-1 text-muted-foreground">আপনার জেলা বেছে নিন — আজকের ওয়াক্ত, সাহরি-ইফতার ও পুরো মাসের সময়সূচি।</p>
      <PrayerTimesTool initialSlug={valid} />
    </section>
  );
}
