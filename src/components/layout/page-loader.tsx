/** Branded loading state shown by loading.tsx while a page renders on the server. */
export function PageLoader({ label = "লোড হচ্ছে", compact = false }: { label?: string; compact?: boolean }) {
  return (
    <div role="status" aria-live="polite" className={`flex flex-col items-center justify-center gap-5 ${compact ? "py-16" : "min-h-[50vh] py-24"}`}>
      <div className="zm-loader relative size-20" aria-hidden>
        {/* Track */}
        <span className="absolute inset-0 rounded-full border-[5px] border-primary/10" />
        {/* Outer arc — spins clockwise */}
        <span className="zm-spin absolute inset-0 rounded-full border-[5px] border-transparent border-t-accent border-r-accent/60" />
        {/* Inner arc — spins the other way */}
        <span className="zm-spin-rev absolute inset-[11px] rounded-full border-[4px] border-transparent border-b-primary border-l-primary/50" />
        {/* Crescent — gentle pulse */}
        <span className="zm-pulse absolute inset-0 grid place-items-center text-xl text-primary">☪</span>
      </div>
      <p className="flex items-end gap-1 text-sm font-medium text-muted-foreground">
        {label}
        <span className="flex gap-0.5 pb-1">
          <span className="zm-dot size-1 rounded-full bg-accent" />
          <span className="zm-dot size-1 rounded-full bg-accent [animation-delay:150ms]" />
          <span className="zm-dot size-1 rounded-full bg-accent [animation-delay:300ms]" />
        </span>
      </p>
      <span className="sr-only">পেজ লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন।</span>
    </div>
  );
}
