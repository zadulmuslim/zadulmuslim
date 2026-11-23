import { Logo } from "./logo";
import { MegaMenu } from "./mega-menu";
import { MobileNav } from "./mobile-nav";
import { HeaderSearch } from "./header-search";
import { UserMenu } from "./user-menu";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b-2 border-accent bg-brand-deep">
      {/* Mobile: menu · logo · search + profile, with equal space between them. Desktop: logo · menu · search + profile. */}
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-3 sm:px-4 lg:gap-3">
        <div className="flex lg:hidden">
          <MobileNav />
        </div>
        <Logo compactOnMobile className="min-w-0" />
        <MegaMenu />
        <div className="flex items-center justify-end gap-1">
          <HeaderSearch />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
