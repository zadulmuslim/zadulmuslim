import Link from "next/link";
import { mainNav } from "@/config/site";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { AuthButton } from "./auth-button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b-2 border-accent bg-brand-deep">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo />
        <nav aria-label="প্রধান মেনু" className="hidden xl:block">
          <ul className="flex items-center gap-1">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="rounded-full px-2 py-1.5 text-[13px] text-white/90 transition-colors hover:bg-white/10 hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-1">
          <AuthButton />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
