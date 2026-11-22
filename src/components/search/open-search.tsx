"use client";
import { Search } from "lucide-react";

export const OPEN_SEARCH_EVENT = "zm:open-search";

/** Looks like a search bar; clicking anywhere on it opens the live search popup. */
export function SearchTrigger({ placeholder, className }: { placeholder: string; className?: string }) {
  const open = () => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
  return (
    <div
      role="button"
      tabIndex={0}
      aria-haspopup="dialog"
      aria-label="সার্চ খুলুন"
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
      className={className}
    >
      <Search className="pointer-events-none ml-3 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="pointer-events-none min-w-0 flex-1 select-none truncate px-3 text-left text-sm text-muted-foreground">{placeholder}</span>
      {/* Display only — the whole bar opens the search popup. */}
      <span aria-hidden className="pointer-events-none inline-flex h-10 select-none items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">
        <Search className="size-4" />
        খুঁজুন
      </span>
    </div>
  );
}
