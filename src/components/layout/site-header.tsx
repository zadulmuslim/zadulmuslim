import { Logo } from "./logo";
import { MegaMenu } from "./mega-menu";
import { MobileNav } from "./mobile-nav";
import { HeaderSearch } from "./header-search";
import { UserMenu } from "./user-menu";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b-2 border-accent bg-brand-deep">
      {/* Mobile: menu · logo (centre) · search + profile. Desktop: logo · menu · search + profile. */}
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 sm:px-4 lg:flex lg:justify-between lg:gap-3">
        <div className="flex justify-start lg:hidden">
          <MobileNav />
        </div>
        <Logo compactOnMobile className="justify-self-center lg:justify-self-auto" />
        <MegaMenu />
        <div className="flex items-center justify-end gap-1">
          <HeaderSearch />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
