import Link from "next/link";
import { siteConfig } from "@/config/site";

/** Slim footer for the admin panel (separate from the public site footer). */
export function AdminFooter() {
  return (
    <footer className="mt-12 border-t pt-5 text-xs text-muted-foreground">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-semibold text-primary">{siteConfig.nameBn}</span> অ্যাডমিন প্যানেল · © {siteConfig.copyrightYear}
        </p>
        <nav aria-label="অ্যাডমিন ফুটার" className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/" className="hover:text-primary">সাইট দেখুন</Link>
          <Link href="/admin/questions?status=pending" className="hover:text-primary">অপেক্ষমাণ প্রশ্ন</Link>
          <Link href="/admin/media" className="hover:text-primary">মিডিয়া</Link>
          <Link href="/account" className="hover:text-primary">আমার অ্যাকাউন্ট</Link>
          <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-primary">সহায়তা</a>
        </nav>
      </div>
      <p className="mt-3 text-[11px]">ফাইল সংরক্ষণ: Cloudflare R2 · ডাটাবেস ও লগইন: Supabase · হোস্টিং: Vercel</p>
    </footer>
  );
}
