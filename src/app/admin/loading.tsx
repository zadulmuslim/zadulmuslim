/** Skeleton shown while an admin page loads (keeps the sidebar visible). */
export default function AdminLoading() {
  return (
    <div role="status" aria-live="polite" aria-label="লোড হচ্ছে…" className="animate-pulse motion-reduce:animate-none">
      <div className="mb-6 border-b-2 border-accent/30 pb-3">
        <div className="h-7 w-48 rounded-md bg-secondary" />
        <div className="mt-2 h-4 w-72 rounded bg-secondary/70" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl border bg-card" />
        ))}
      </div>
      <div className="mt-6 space-y-px overflow-hidden rounded-xl border bg-card">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="h-4 w-2/3 rounded bg-secondary" />
            <div className="h-6 w-20 rounded-full bg-secondary/80" />
          </div>
        ))}
      </div>
      <span className="sr-only">লোড হচ্ছে…</span>
    </div>
  );
}
