import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/content/breadcrumbs";
import { ZakatCalculator } from "@/components/tools/zakat-calculator";

export const metadata: Metadata = {
  title: "যাকাত ক্যালকুলেটর",
  description: "নগদ অর্থ, স্বর্ণ, রূপা, ব্যবসার পণ্য ও দেনা হিসাব করে সহজে যাকাতের পরিমাণ বের করুন (হানাফী মাযহাব অনুযায়ী নিসাব)।",
  alternates: { canonical: "/zakat" },
};

const RULES = [
  ["কার ওপর ফরয", "প্রাপ্তবয়স্ক, সুস্থ মস্তিষ্কের মুসলিম, যার কাছে মৌলিক প্রয়োজনের অতিরিক্ত নিসাব পরিমাণ সম্পদ পূর্ণ এক চান্দ্রবছর (হাওল) থাকে।"],
  ["নিসাব", "সাড়ে বায়ান্ন (৫২.৫) ভরি রূপা অথবা তার সমমূল্যের সম্পদ। কারো কাছে শুধু স্বর্ণ থাকলে (অন্য কোনো যাকাতযোগ্য সম্পদ না থাকলে) নিসাব সাড়ে সাত (৭.৫) ভরি স্বর্ণ।"],
  ["কোন সম্পদে যাকাত", "নগদ টাকা, ব্যাংকে জমা, স্বর্ণ-রূপা (ব্যবহৃত গয়নাসহ), ব্যবসার পণ্য, ফেরতযোগ্য পাওনা ও বিনিয়োগ।"],
  ["যাকাত নেই যেসবে", "বসবাসের বাড়ি, ব্যবহারের গাড়ি ও আসবাব, পরিধেয় কাপড়, ব্যবসার যন্ত্রপাতি ও দোকানঘর (বিক্রির উদ্দেশ্য না হলে)।"],
  ["হার", "যাকাতযোগ্য নিট সম্পদের ২.৫ শতাংশ (চল্লিশ ভাগের এক ভাগ)।"],
  ["হিসাবের দিন", "যে তারিখে প্রথম নিসাবের মালিক হয়েছিলেন, প্রতি চান্দ্রবছর সেই তারিখে থাকা সম্পদের হিসাব করুন।"],
];

export default function ZakatPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <Breadcrumbs items={[{ label: "হোম", href: "/" }, { label: "যাকাত ক্যালকুলেটর" }]} />
      <h1 className="text-3xl font-bold text-primary">যাকাত ক্যালকুলেটর</h1>
      <p className="mb-6 mt-1 max-w-2xl text-muted-foreground">
        আপনার সম্পদের পরিমাণ লিখুন — যাকাত ফরয কি না এবং কত টাকা দিতে হবে তা সাথে সাথে দেখাবে। স্বর্ণ ও রূপার দাম{" "}
        <a href="https://www.bajus.org/gold-price" target="_blank" rel="noreferrer" className="font-semibold text-primary underline">বাজুসের ওয়েবসাইটে</a> দেখে নিন।
      </p>
      <ZakatCalculator />
      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-primary">যাকাতের মৌলিক বিধান</h2>
          <dl className="space-y-4">
            {RULES.map(([t, b]) => (
              <div key={t}>
                <dt className="font-semibold">{t}</dt>
                <dd className="text-sm leading-relaxed text-muted-foreground">{b}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="h-fit rounded-2xl border border-dashed bg-card p-5 text-sm leading-relaxed text-muted-foreground">
          <p className="font-semibold text-foreground">বিশেষ দ্রষ্টব্য</p>
          <p className="mt-1">এই ক্যালকুলেটর সাধারণ হিসাবের সহায়ক। ঋণ, যৌথ ব্যবসা, প্রভিডেন্ট ফান্ড বা জটিল পরিস্থিতিতে নির্ভরযোগ্য মুফতির পরামর্শ নিন।</p>
          <Link href="/ask" className="mt-3 inline-block font-semibold text-primary underline">যাকাত নিয়ে প্রশ্ন করুন</Link>
        </div>
      </div>
    </section>
  );
}
