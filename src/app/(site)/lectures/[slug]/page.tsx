import { Comments } from "@/components/comments/comments";
import { PostReactions } from "@/components/comments/post-reactions";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/content/breadcrumbs";
import { ShareButtons } from "@/components/content/share-buttons";
import { LectureCard } from "@/components/content/lecture-card";
import { getLecture, KIND_LABEL, listLectures } from "@/lib/library";
import { formatBnDate } from "@/lib/format";
import { toBnDigits } from "@/lib/utils";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const l = await getLecture(decodeURIComponent((await params).slug));
  if (!l) return {};
  return { title: l.title, description: l.description?.slice(0, 160) ?? undefined, alternates: { canonical: `/lectures/${l.slug}` } };
}

export default async function LecturePage({ params }: { params: Promise<{ slug: string }> }) {
  const l = await getLecture(decodeURIComponent((await params).slug));
  if (!l) notFound();
  const more = (await listLectures(undefined, 7)).filter((x) => x.id !== l.id).slice(0, 6);
  return (
    <article className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      <Breadcrumbs items={[{ label: "হোম", href: "/" }, { label: "বয়ান", href: "/lectures" }, { label: l.title }]} />
      <div className="overflow-hidden rounded-2xl border bg-black shadow-md">
        {l.youtube ? (
          <iframe
            className="aspect-video w-full"
            src={`https://www.youtube-nocookie.com/embed/${l.youtube}?rel=0`}
            title={l.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        ) : l.video ? (
          <video src={l.video.url} controls preload="metadata" poster={l.thumb?.url} className="aspect-video w-full" />
        ) : l.audio ? (
          <div className="bg-gradient-to-br from-brand-deep to-primary p-6">
            <audio src={l.audio.url} controls preload="metadata" className="w-full" />
          </div>
        ) : null}
      </div>
      <h1 className="mt-5 text-2xl font-bold text-primary md:text-3xl">{l.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {[l.speaker, KIND_LABEL[l.kind], l.duration_seconds ? `${toBnDigits(Math.round(l.duration_seconds / 60))} মিনিট` : null, l.published_at ? formatBnDate(l.published_at) : null].filter(Boolean).join(" · ")}
      </p>
      {l.youtube && l.audio && <audio src={l.audio.url} controls preload="none" className="mt-4 w-full" aria-label="অডিও শুনুন" />}
      {l.description && <p className="mt-5 whitespace-pre-line leading-relaxed">{l.description}</p>}
      <PostReactions type="lecture" id={l.id} />
      <div className="mt-6"><ShareButtons title={l.title} /></div>
      <Comments type="lecture" id={l.id} />
      {more.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-bold text-primary">আরও বয়ান</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{more.map((x) => <LectureCard key={x.id} l={x} />)}</div>
        </section>
      )}
    </article>
  );
}
