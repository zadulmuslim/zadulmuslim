import Link from "next/link";
import { Music, Play } from "lucide-react";
import { KIND_LABEL, type LectureCard as L } from "@/lib/library";
import { toBnDigits } from "@/lib/utils";

export function LectureCard({ l }: { l: L }) {
  return (
    <Link href={`/lectures/${l.slug}`} className="group block overflow-hidden rounded-xl border bg-card shadow-sm transition hover:border-accent hover:shadow-md">
      <div className="relative aspect-video bg-gradient-to-br from-brand-deep to-primary">
        {l.thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={l.thumb} alt="" loading="lazy" className="size-full object-cover" />
        ) : null}
        <span className="absolute inset-0 grid place-items-center bg-black/10 transition group-hover:bg-black/25">
          <span className="grid size-12 place-items-center rounded-full bg-white/90 text-primary shadow">
            {l.kind === "nasheed" ? <Music className="size-5" /> : <Play className="size-5 fill-primary" />}
          </span>
        </span>
        {l.duration_seconds ? <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px] text-white">{toBnDigits(Math.round(l.duration_seconds / 60))} মি.</span> : null}
      </div>
      <div className="p-4">
        <p className="line-clamp-2 font-semibold leading-snug group-hover:text-primary">{l.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{[l.speaker, KIND_LABEL[l.kind]].filter(Boolean).join(" · ")}</p>
      </div>
    </Link>
  );
}
