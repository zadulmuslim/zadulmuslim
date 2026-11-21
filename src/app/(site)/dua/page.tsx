import type { Metadata } from "next";
import { DuaView } from "@/components/hadith/dua-view";

export const revalidate = 604800;

export const metadata: Metadata = {
  title: "দোয়া ও যিকির — সহীহ হাদীস থেকে",
  description: "সকাল-সন্ধ্যার যিকির, মাসনূন দোয়া, সালাতের যিকির ও বিভিন্ন পরিস্থিতির দোয়া — আরবি, বাংলা অনুবাদ ও সূত্রসহ।",
  alternates: { canonical: "/dua" },
};

export default function DuaPage() {
  return <DuaView />;
}
