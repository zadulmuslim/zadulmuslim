import { Breadcrumbs } from "./breadcrumbs";
import { siteConfig } from "@/config/site";

/** Layout for policy pages: title, last-updated date and numbered sections. */
export function LegalPage({ title, updated, intro, sections }: { title: string; updated: string; intro: string; sections: { heading: string; body: React.ReactNode }[] }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <Breadcrumbs items={[{ label: "হোম", href: "/" }, { label: title }]} />
      <h1 className="mt-4 text-3xl font-bold text-primary">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">সর্বশেষ হালনাগাদ: {updated}</p>
      <p className="mt-6 leading-relaxed">{intro}</p>
      <ol className="mt-8 space-y-7">
        {sections.map((s, i) => (
          <li key={s.heading}>
            <h2 className="mb-2 text-lg font-bold text-primary">{["১","২","৩","৪","৫","৬","৭","৮","৯","১০"][i]}. {s.heading}</h2>
            <div className="space-y-2 leading-relaxed text-foreground/90">{s.body}</div>
          </li>
        ))}
      </ol>
      <p className="mt-10 rounded-xl border bg-card p-4 text-sm">
        কোনো প্রশ্ন বা অনুরোধ থাকলে লিখুন: <a href={`mailto:${siteConfig.contact.email}`} className="font-semibold text-primary hover:underline" dir="ltr">{siteConfig.contact.email}</a>
      </p>
    </article>
  );
}
