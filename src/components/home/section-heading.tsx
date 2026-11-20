import Link from "next/link";

export function SectionHeading({ title, href, linkLabel = "সব দেখুন", id }: { title: string; href?: string; linkLabel?: string; id?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 border-b-2 border-accent/70 pb-2">
      <h2 id={id} className="text-xl font-bold text-primary md:text-2xl">{title}</h2>
      {href && (
        <Link href={href} className="shrink-0 text-xs text-muted-foreground hover:text-primary hover:underline md:text-sm">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
