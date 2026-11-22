import { Breadcrumbs } from "./breadcrumbs";

/** Green patterned header used by About, Contact and policy pages. */
export function PageHero({ title, subtitle, crumb, children }: { title: string; subtitle?: string; crumb: string; children?: React.ReactNode }) {
  return (
    <div className="hero-pattern text-white">
      <div className="mx-auto max-w-6xl px-4 pb-14 pt-6 md:pb-16">
        <div className="[&_*]:!text-white/75 [&_a:hover]:!text-white">
          <Breadcrumbs items={[{ label: "হোম", href: "/" }, { label: crumb }]} />
        </div>
        <h1 className="mt-6 text-3xl font-bold md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/85 md:text-lg">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
