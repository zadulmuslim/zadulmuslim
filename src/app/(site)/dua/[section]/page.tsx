import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DUA_SECTIONS } from "@/lib/hadith";
import { DuaView } from "@/components/hadith/dua-view";

export const revalidate = 604800;
export const dynamicParams = false;

export function generateStaticParams() {
  return DUA_SECTIONS.map((s) => ({ section: String(s.id) }));
}

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
  const n = Number((await params).section);
  const s = DUA_SECTIONS.find((x) => x.id === n);
  return s ? { title: `${s.title} — দোয়া ও যিকির`, alternates: { canonical: `/dua/${s.id}` } } : {};
}

export default async function DuaSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const id = Number((await params).section);
  if (!DUA_SECTIONS.some((s) => s.id === id)) notFound();
  return <DuaView sectionId={id} />;
}
