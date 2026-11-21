import type { Metadata } from "next";
import { CollectionPage } from "@/components/content/collection-page";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "জীবনী — সাহাবী ও মুসলিম মনীষী",
  description: "খুলাফায়ে রাশেদীন ও ইসলামের মহান ইমামদের সংক্ষিপ্ত জীবনী, নির্ভরযোগ্য সূত্রসহ।",
  alternates: { canonical: "/biography" },
};

export default function BiographyPage() {
  return (
    <CollectionPage
      slug="biography"
      title="জীবনী"
      intro="খুলাফায়ে রাশেদীন, সাহাবায়ে কেরাম ও ইসলামের মহান ইমামদের জীবন থেকে শিক্ষা — নির্ভরযোগ্য সূত্রের আলোকে সংক্ষিপ্ত জীবনী।"
    />
  );
}
