import type { Metadata } from "next";
import { CollectionPage } from "@/components/content/collection-page";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "সীরাত — রাসূলুল্লাহ ﷺ-এর জীবনী",
  description: "জন্ম, নবুওয়ত, হিজরত, মদীনার জীবন, মক্কা বিজয় ও বিদায় হজ্জ — রাসূলুল্লাহ ﷺ-এর জীবনের ধারাবাহিক অধ্যায়, সহীহ সূত্রসহ।",
  alternates: { canonical: "/seerah" },
};

export default function SeerahPage() {
  return (
    <CollectionPage
      slug="seerah"
      title="সীরাত"
      ar="ﷺ مُحَمَّدٌ رَسُولُ ٱللَّهِ"
      intro="রাসূলুল্লাহ ﷺ-এর জীবন — জন্ম থেকে ইন্তেকাল পর্যন্ত ধারাবাহিক অধ্যায়ে, কুরআন, সহীহ হাদীস ও নির্ভরযোগ্য সীরাতগ্রন্থের আলোকে।"
      numbered
    />
  );
}
