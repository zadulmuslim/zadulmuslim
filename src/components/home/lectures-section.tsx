import Link from "next/link";
import { Music, Play } from "lucide-react";
import { lectures } from "@/data/home";
import { SectionHeading } from "./section-heading";

/** Teaser for the lectures module (collections, not individual titles, until it launches). */
export function LecturesSection() {
  return (
    <section aria-labelledby="lectures-title" className="mx-auto max-w-6xl px-4 pt-14">
      <SectionHeading id="lectures-title" title="বয়ান ও ভিডিও" href="/lectures" />
      <p className="-mt-2 mb-5 text-sm text-muted-foreground">বয়ান সংকলনের কাজ চলছে — ইনশাআল্লাহ শীঘ্রই প্রকাশিত হবে।</p>
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
            <div className="p-4">
              <p className="font-semibold">{l.title}</p>
              <p className="text-xs text-muted-foreground">{l.body}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
