import { Logo } from "./logo";
import { MegaMenu } from "./mega-menu";
import { MobileNav } from "./mobile-nav";
import { HeaderSearch } from "./header-search";
import { UserMenu } from "./user-menu";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b-2 border-accent bg-brand-deep">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Logo />
        <MegaMenu />
        <div className="flex items-center gap-1">
          {/* Right to left: profile/login, menu, search */}
          <HeaderSearch />
          <MobileNav />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
