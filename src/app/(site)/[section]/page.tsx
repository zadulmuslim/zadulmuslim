import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sectionPages, siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";

/** Placeholder for each module (Quran, Hadith, Q&A …) until it is built. */
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(sectionPages).map((section) => ({ section }));
}

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
  const { section } = await params;
  const title = sectionPages[section];
  return title ? { title, alternates: { canonical: `/${section}` } } : {};
}

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const title = sectionPages[section];
  if (!title) notFound();
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-3xl font-bold text-primary">{title}</h1>
      <p className="mt-4 text-muted-foreground">
        {siteConfig.nameBn}-এর এই অংশটি শীঘ্রই আসছে, ইনশাআল্লাহ।
      </p>
      <Button asChild className="mt-8">
        <Link href="/">হোমপেজে ফিরে যান</Link>
      </Button>
    </section>
  );
}
