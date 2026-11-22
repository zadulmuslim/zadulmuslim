import Link from "next/link";
import { quickLinks, siteConfig } from "@/config/site";
import { SearchTrigger } from "@/components/search/open-search";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative">
      <div className="hero-pattern px-4 pb-28 pt-12 text-center text-white md:pb-32 md:pt-16">
        <p lang="ar" dir="rtl" className="font-arabic text-2xl text-accent md:text-3xl">
          بسم الله الرحمن الرحيم
        </p>
        <h1 id="hero-title" className="mt-4 text-3xl font-bold md:text-5xl">{siteConfig.tagline}</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-white/85 md:text-base">{siteConfig.description}</p>

        <SearchTrigger
          placeholder="কুরআন, হাদীস বা মাসআলা খুঁজুন…"
          className="mx-auto mt-8 flex max-w-xl cursor-pointer items-center rounded-full bg-white p-1.5 shadow-lg transition hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/50"
        />
      </div>

      <nav aria-label="দ্রুত লিংক" className="relative z-10 mx-auto -mt-20 max-w-6xl px-4">
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {quickLinks.map((link) => (
            <li key={link.label} className={"mobileOnly" in link && link.mobileOnly ? "sm:hidden" : undefined}>
              <Link
                href={link.href}
                className="flex h-full flex-col items-center gap-2 rounded-xl border bg-card px-2 py-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-accent hover:shadow-md"
              >
                <span className="text-2xl" aria-hidden>{link.icon}</span>
                <span className="text-xs font-medium text-foreground sm:text-sm">{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
