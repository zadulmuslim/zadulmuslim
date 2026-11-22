"use client";
import { Search } from "lucide-react";

export const OPEN_SEARCH_EVENT = "zm:open-search";

/** Looks like a search bar; opens the live search popup. Falls back to /search without JS. */
export function SearchTrigger({ placeholder, className }: { placeholder: string; className?: string }) {
  return (
    <a
      href="/search"
      role="button"
      aria-haspopup="dialog"
      onClick={(e) => {
        e.preventDefault();
        window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
      }}
      className={className}
    >
      <Search className="ml-3 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 flex-1 truncate px-3 text-left text-sm text-muted-foreground">{placeholder}</span>
      <span className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">
        <Search className="size-4" aria-hidden />
        খুঁজুন
      </span>
    </a>
  );
}
