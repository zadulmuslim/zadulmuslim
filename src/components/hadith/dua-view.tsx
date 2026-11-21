import Link from "next/link";
import { Breadcrumbs } from "@/components/content/breadcrumbs";
import { GradeBadge, HadithSources } from "@/components/hadith/parts";
import { DUA_SECTIONS, hadithsIn } from "@/lib/hadith";
import { cn, toBnDigits } from "@/lib/utils";

/** Du'a & dhikr section view (shared by /dua and /dua/[section]). */
export async function DuaView({ sectionId }: { sectionId?: number }) {
  const active = DUA_SECTIONS.find((s) => s.id === sectionId) ?? DUA_SECTIONS[0]!;
  const items = await hadithsIn(active.id);

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      <Breadcrumbs items={[{ label: "হোম", href: "/" }, { label: "দোয়া ও যিকির" }]} />
      <div className="mb-6 rounded-2xl bg-gradient-to-br from-brand-deep to-primary px-6 py-8 text-center text-white shadow-md">
        <p lang="ar" dir="rtl" className="font-arabic text-2xl text-accent">ٱدْعُونِيٓ أَسْتَجِبْ لَكُمْ</p>
        <h1 className="mt-2 text-3xl font-bold">দোয়া ও যিকির</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-white/80">সহীহ হাদীসে বর্ণিত দোয়া ও যিকির — আরবি মূল পাঠ, বাংলা অর্থ ও সূত্রসহ।</p>
      </div>

      <nav aria-label="দোয়ার বিভাগ" className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
        {DUA_SECTIONS.map((s) => (
          <Link key={s.id} href={s.id === DUA_SECTIONS[0]!.id ? "/dua" : `/dua/${s.id}`} aria-current={s.id === active.id ? "page" : undefined} className={cn("whitespace-nowrap rounded-full border px-4 py-1.5 text-sm", s.id === active.id ? "border-primary bg-primary font-semibold text-white" : "bg-card hover:border-accent")}>
            {s.title}
          </Link>
        ))}
      </nav>

      <h2 className="mb-4 text-xl font-bold text-primary">{active.title} <span className="text-sm font-normal text-muted-foreground">({toBnDigits(items.length)})</span></h2>
      {items.length === 0 ? (
        <p className="rounded-xl border bg-card px-4 py-10 text-center text-sm text-muted-foreground">এই বিভাগে এখনো কিছু নেই।</p>
      ) : (
        <ol className="space-y-5">
          {items.map((h, i) => (
            <li key={h.id} id={`d-${h.id}`} className="scroll-mt-24 rounded-2xl border bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-white">{toBnDigits(i + 1)}</span>
                <h3 className="font-bold leading-snug">{h.title_bn}</h3>
              </div>
              {h.hadeeth_ar && <p lang="ar" dir="rtl" className="font-arabic rounded-xl bg-secondary/40 p-4 text-xl leading-[2.1]">{h.hadeeth_ar}</p>}
              <p className="mt-3 whitespace-pre-line leading-relaxed">{h.hadeeth_bn}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <GradeBadge grade={h.grade_bn} />
                {h.attribution_bn && <span>{h.attribution_bn}</span>}
                <Link href={`/hadith/${h.id}`} className="ml-auto font-semibold text-primary hover:underline">ব্যাখ্যা ও শিক্ষা →</Link>
              </div>
            </li>
          ))}
        </ol>
      )}
      <HadithSources className="mt-10" />
    </section>
  );
}
