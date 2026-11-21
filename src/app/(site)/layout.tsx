import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ViewerProvider } from "@/components/layout/viewer";

/** Public website frame (header + footer). The admin panel has its own layout. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <ViewerProvider>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </ViewerProvider>
  );
}
