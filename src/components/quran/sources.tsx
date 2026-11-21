import { getSources } from "@/lib/quran";
import { cn } from "@/lib/utils";

/** Licence-required attribution for the Quran text and translation. */
export async function QuranSources({ className }: { className?: string }) {
  const sources = (await getSources()).filter((s) => s.key.startsWith("quran_"));
  if (!sources.length) return null;
  return (
    <aside className={cn("rounded-xl border border-dashed bg-card p-4 text-xs leading-relaxed text-muted-foreground", className)} aria-label="উৎস ও স্বত্ব">
      <p className="mb-2 font-semibold text-foreground">উৎস ও স্বত্ব</p>
      <ul className="space-y-1.5">
        {sources.map((s) => (
          <li key={s.key}>
            <strong className="text-foreground">{s.title_bn}:</strong> {s.attribution}{" "}
            (<a href={s.url} target="_blank" rel="noreferrer" className="text-primary underline" dir="ltr">{s.url.replace(/^https?:\/\//, "")}</a>){s.version ? ` · সংস্করণ: ${s.version}` : ""} · {s.license}
          </li>
        ))}
      </ul>
    </aside>
  );
}
