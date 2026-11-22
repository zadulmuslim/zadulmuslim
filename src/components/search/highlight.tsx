/** Wraps occurrences of the query (either Unicode form of য়/ড়/ঢ়) in <mark>. */
function variants(q: string): string[] {
  const d = q.normalize("NFC").replace(/য়/g, "য়").replace(/ড়/g, "ড়").replace(/ঢ়/g, "ঢ়");
  const c = d.replace(/য়/g, "য়").replace(/ড়/g, "ড়").replace(/ঢ়/g, "ঢ়");
  return [...new Set([d, c])].filter(Boolean);
}
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function Highlight({ text, q }: { text: string; q: string }) {
  const term = q.trim();
  if (term.length < 2) return <>{text}</>;
  const re = new RegExp(`(${variants(term).map(esc).join("|")})`, "gi");
  const parts = text.split(re);
  return (
    <>
      {parts.map((p, i) => (i % 2 === 1 ? <mark key={i} className="rounded bg-accent/30 px-0.5 text-inherit">{p}</mark> : p))}
    </>
  );
}
