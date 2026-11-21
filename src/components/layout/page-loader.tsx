/** Branded loading state shown by loading.tsx while a page renders on the server. */
export function PageLoader({ label = "লোড হচ্ছে…", compact = false }: { label?: string; compact?: boolean }) {
  return (
    <div role="status" aria-live="polite" className={`flex flex-col items-center justify-center gap-4 ${compact ? "py-16" : "min-h-[50vh] py-24"}`}>
      <div className="relative size-14">
        <span className="absolute inset-0 rounded-full border-4 border-primary/15" />
        <span className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-accent border-r-primary motion-reduce:animate-none" />
        <span className="absolute inset-0 grid place-items-center text-lg text-primary" aria-hidden>☪</span>
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
