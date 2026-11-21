import Link from "next/link";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/** Status tabs + category select + search box, all as plain GET links/forms. */
export function ListFilters({
  basePath,
  tabs,
  status,
  q,
  category,
  categories,
}: {
  basePath: string;
  tabs: readonly { value: string; label: string }[];
  status: string;
  q: string;
  category: string;
  categories: { id: string; name_bn: string }[];
}) {
  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    Object.entries({ status, q, category, ...patch }).forEach(([k, v]) => v && p.set(k, v));
    return `${basePath}?${p}`;
  };
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <Link key={t.value} href={href({ status: t.value })} className={cn("rounded-full border px-3.5 py-1 text-sm", status === t.value ? "border-primary bg-primary text-white" : "bg-card hover:border-accent")}>
            {t.label}
          </Link>
        ))}
      </div>
      <form action={basePath} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="status" value={status} />
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input name="q" defaultValue={q} placeholder="শিরোনামে খুঁজুন…" className="h-10 w-full rounded-full border bg-card pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <select name="category" defaultValue={category} className="h-10 rounded-full border bg-card px-3 text-sm" aria-label="বিষয় অনুযায়ী ফিল্টার">
          <option value="">সব বিষয়</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name_bn}</option>)}
        </select>
        <button type="submit" className="h-10 rounded-full bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90">ফিল্টার</button>
        {(q || category) && <Link href={href({ q: undefined, category: undefined })} className="text-sm text-muted-foreground hover:text-primary">মুছে দিন</Link>}
      </form>
    </div>
  );
}
