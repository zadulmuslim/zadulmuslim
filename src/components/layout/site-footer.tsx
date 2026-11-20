import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { footerLinks, siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t-4 border-accent bg-brand-deep text-white/85">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-3">
        <div>
          <p className="text-xl font-bold text-accent">
            {[siteConfig.nameBn, ...siteConfig.associatedPlatforms].join(" | ")}
          </p>
          <p className="mt-3 text-sm">{siteConfig.footerAbout}</p>
        </div>
        <div>
          <h2 className="mb-3 font-semibold text-accent">গুরুত্বপূর্ণ লিংক</h2>
          <ul className="space-y-1.5 text-sm">
            {footerLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white hover:underline">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-3 font-semibold text-accent">যোগাযোগ</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><MapPin className="size-4 text-accent" />{siteConfig.contact.location}</li>
            <li className="flex items-center gap-2">
              <Mail className="size-4 text-accent" />
              <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-white hover:underline">{siteConfig.contact.email}</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/15 py-4 text-center text-xs text-white/70">
        © {siteConfig.copyrightYear} {siteConfig.nameBn}। সর্বস্বত্ব সংরক্ষিত।
      </div>
    </footer>
  );
}
