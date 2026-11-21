import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { gradeTone, type HadithSummary } from "@/lib/hadith";
import { getSources } from "@/lib/quran";
import { cn, toBnDigits } from "@/lib/utils";

export function GradeBadge({ grade, className }: { grade: string | null; className?: string }) {
  if (!grade) return null;
  const tone = gradeTone(grade);
  const short = grade.length > 18 ? (tone === "sahih" ? "সহীহ" : tone === "hasan" ? "হাসান" : grade.slice(0, 18) + "…") : grade;
  return (
    <span
      title={grade}
      className={cn(
        "inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        tone === "sahih" ? "bg-primary/10 text-primary" : tone === "hasan" ? "bg-accent/20 text-[#7a5410]" : "bg-secondary text-muted-foreground",
        className,
      )}
    >
      {short}
    </span>
  );
}

export function HadithList({ rows }: { rows: HadithSummary[] }) {
  return (
    <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-sm">
      {rows.map((h) => (
        <li key={h.id}>
          <Link href={`/hadith/${h.id}`} className="group flex items-start gap-3 px-4 py-4 hover:bg-secondary/40 sm:px-5">
            <ChevronRight className="mt-1 size-4 shrink-0 text-accent" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block break-words font-medium leading-relaxed group-hover:text-primary">{h.title_bn}</span>
              <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <GradeBadge grade={h.grade_bn} />
                {h.attribution_bn && <span>{h.attribution_bn}</span>}
                <span>· নং {toBnDigits(h.id)}</span>
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export async function HadithSources({ className }: { className?: string }) {
  const s = (await getSources()).find((x) => x.key === "hadith_bn");
  if (!s) return null;
  return (
    <p className={cn("rounded-xl border border-dashed bg-card p-4 text-xs leading-relaxed text-muted-foreground", className)}>
      <strong className="text-foreground">উৎস ও স্বত্ব:</strong> {s.attribution} (
      <a href={s.url} target="_blank" rel="noreferrer" className="text-primary underline" dir="ltr">hadeethenc.com</a>){s.version ? ` · সংস্করণ: ${s.version}` : ""} · {s.license}
    </p>
  );
}
