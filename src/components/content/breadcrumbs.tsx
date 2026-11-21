import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="অবস্থান" className="mb-4 text-xs text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronLeft className="size-3 rotate-180" aria-hidden />}
            {it.href ? <Link href={it.href} className="hover:text-primary">{it.label}</Link> : <span className="text-foreground">{it.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
