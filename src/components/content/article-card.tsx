import Link from "next/link";
import { BookOpen } from "lucide-react";
import { formatBnDate } from "@/lib/format";
import { toBnDigits } from "@/lib/utils";

export interface ArticleCardData {
  slug: string;
  title: string;
  excerpt: string | null;
  author_name: string | null;
  reading_minutes: number | null;
  published_at: string | null;
  article_categories: { name_bn: string; slug: string } | null;
  media: { public_url: string | null; alt_text: string | null } | null;
}

export function ArticleCard({ a }: { a: ArticleCardData }) {
  return (
    <Link href={`/articles/${a.slug}`} className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {a.media?.public_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={a.media.public_url} alt={a.media.alt_text ?? ""} loading="lazy" className="aspect-[16/9] w-full object-cover" />
      ) : (
        <div className="grid aspect-[16/9] place-items-center bg-gradient-to-br from-brand-deep to-primary">
          <BookOpen className="size-10 text-accent/80" aria-hidden />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        {a.article_categories && <span className="text-xs font-semibold text-accent">{a.article_categories.name_bn}</span>}
        <h3 className="mt-1 text-lg font-bold leading-snug text-primary group-hover:underline">{a.title}</h3>
        {a.excerpt && <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">{a.excerpt}</p>}
        <p className="mt-3 border-t border-dashed pt-2 text-xs text-muted-foreground">
          {a.author_name ? `${a.author_name} · ` : ""}পড়তে {toBnDigits(a.reading_minutes ?? 1)} মিনিট · {formatBnDate(a.published_at)}
        </p>
      </div>
    </Link>
  );
}
