import type { Metadata, Viewport } from "next";
import "@fontsource/hind-siliguri/400.css";
import "@fontsource/hind-siliguri/500.css";
import "@fontsource/hind-siliguri/600.css";
import "@fontsource/hind-siliguri/700.css";
import "@fontsource/amiri/400.css";
import "./globals.css";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.nameBn} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.nameBn}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: ["যাদুল মুসলিম", "Zadulmuslim", "মাসআলা", "প্রশ্নোত্তর", "কুরআন", "হাদীস", "ফিকহ", "নামাজের সময়", "দু'আ", ...siteConfig.associatedPlatforms],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: "/",
    siteName: siteConfig.nameBn,
    title: `${siteConfig.nameBn} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.nameBn} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#064d26",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <body className="min-h-screen">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded focus:bg-white focus:p-2">
          মূল বিষয়বস্তুতে যান
        </a>
        {children}
      </body>
    </html>
  );
}
