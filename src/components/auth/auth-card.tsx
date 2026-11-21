import { siteConfig } from "@/config/site";

export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-md px-4 py-12 md:py-16">
      <div className="rounded-2xl border border-t-4 border-t-accent bg-card p-6 shadow-sm md:p-8">
        <p lang="ar" dir="rtl" className="text-center font-arabic text-lg text-accent">بسم الله الرحمن الرحيم</p>
        <h1 className="mt-2 text-center text-2xl font-bold text-primary">{title}</h1>
        {subtitle && <p className="mt-1 text-center text-sm text-muted-foreground">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div>}
      <p className="sr-only">{siteConfig.nameBn}</p>
    </section>
  );
}
