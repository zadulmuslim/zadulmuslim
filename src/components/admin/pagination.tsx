import Link from "next/link";
import { toBnDigits } from "@/lib/utils";

export function Pagination({ page, pageCount, makeHref }: { page: number; pageCount: number; makeHref: (p: number) => string }) {
  if (pageCount <= 1) return null;
  const cls = "rounded-full border bg-card px-4 py-1.5 text-sm hover:border-accent";
  return (
    <nav className="mt-6 flex items-center justify-center gap-3" aria-label="পৃষ্ঠা">
      {page > 1 && <Link className={cls} href={makeHref(page - 1)}>← আগের</Link>}
      <span className="text-sm text-muted-foreground">পৃষ্ঠা {toBnDigits(page)} / {toBnDigits(pageCount)}</span>
      {page < pageCount && <Link className={cls} href={makeHref(page + 1)}>পরের →</Link>}
    </nav>
  );
}
