import Link from "next/link";
import { Music, Play } from "lucide-react";
import { lectures } from "@/data/home";
import { SectionHeading } from "./section-heading";

/**
 * Thumbnails will be R2 public URLs (lectures/thumbnails/...) via next/image
 * once lectures are stored in Supabase; until then a branded placeholder is shown.
 */
export function LecturesSection() {
  return (
    <section aria-labelledby="lectures-title" className="mx-auto max-w-6xl px-4 pt-14">
      <SectionHeading id="lectures-title" title="সাম্প্রতিক বয়ান ও ভিডিও" href="/lectures" />
      <div className="grid gap-4 sm:grid-cols-3">
        {lectures.map((l) => (
          <Link key={l.title} href="/lectures" className="group overflow-hidden rounded-xl border bg-card shadow-sm transition hover:shadow-md">
            <div className="grid aspect-video place-items-center bg-gradient-to-br from-brand-deep to-primary">
              {l.kind === "nasheed" ? (
                <Music className="size-10 text-accent transition group-hover:scale-110" aria-hidden />
              ) : (
                <Play className="size-10 fill-accent text-accent transition group-hover:scale-110" aria-hidden />
              )}
            </div>
            <p className="p-4 text-sm font-medium">{l.title}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
