import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ViewerProvider } from "@/components/layout/viewer";

export default function NotFound() {
  return (
    <ViewerProvider>
    <div className="flex min-h-screen flex-col">
    <SiteHeader />
    <main id="main" className="flex-1">
    <section className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-6xl font-bold text-accent">৪০৪</p>
      <h1 className="mt-4 text-2xl font-bold text-primary">পৃষ্ঠাটি পাওয়া যায়নি</h1>
      <p className="mt-2 text-muted-foreground">আপনি যে পৃষ্ঠাটি খুঁজছেন তা সরানো হয়েছে অথবা বিদ্যমান নেই।</p>
      <Button asChild className="mt-8"><Link href="/">হোমপেজে ফিরে যান</Link></Button>
    </section>
    </main>
    <SiteFooter />
    </div>
    </ViewerProvider>
  );
}
