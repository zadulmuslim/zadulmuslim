import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function Logo({ className, onDark = true }: { className?: string; onDark?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)} aria-label={`${siteConfig.nameBn} — হোম`}>
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-lg text-brand-deep shadow-inner" aria-hidden>
        ☪
      </span>
      <span className="flex flex-col leading-tight">
        <span className={cn("text-lg font-bold", onDark ? "text-white" : "text-primary")}>{siteConfig.nameBn}</span>
        <span className={cn("text-[11px]", onDark ? "text-gold-soft/80" : "text-muted-foreground")}>
          {siteConfig.associatedPlatforms.join(" · ")}
        </span>
      </span>
    </Link>
  );
}
