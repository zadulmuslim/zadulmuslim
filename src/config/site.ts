/**
 * Single source of truth for Zadulmuslim branding.
 * Bengali UI text uses `nameBn` (যাদুল মুসলিম); technical identifiers,
 * metadata and English contexts use `name` (Zadulmuslim).
 */
export const siteConfig = {
  name: "Zadulmuslim",
  nameBn: "যাদুল মুসলিম",
  slug: "zadulmuslim",
  tagline: "ইলম, আমল ও সেবা — এক ঠিকানায়",
  description:
    "কুরআন, হাদীস, ফিকহ, নামাজের সময়, দু'আ ও মাসায়েল — নির্ভরযোগ্য আলেমদের দিকনির্দেশনায়।",
  descriptionEn:
    "Zadulmuslim — Quran, Hadith, Fiqh, prayer times, du'a and Islamic Q&A in Bengali, guided by trusted scholars.",
  /** Associated platform names kept alongside the main brand. */
  associatedPlatforms: ["ফিকহ লাইট", "হিদায়াহ হাব"] as const,
  footerAbout: "কুরআন ও সুন্নাহর আলোয় বাংলা ভাষাভাষী উম্মাহর সেবায়।",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "bn_BD",
  contact: {
    location: "ঢাকা, বাংলাদেশ",
    email: "info@example.com", // TODO: replace with the official Zadulmuslim address
  },
  copyrightYear: "২০২৬",
} as const;

export type SiteConfig = typeof siteConfig;

export const mainNav = [
  { label: "কুরআন", href: "/quran" },
  { label: "হাদীস", href: "/hadith" },
  { label: "মাসয়ালা-মাসায়েল", href: "/masail" },
  { label: "সীরাত", href: "/seerah" },
  { label: "জীবনী", href: "/biography" },
  { label: "প্রবন্ধ", href: "/articles" },
  { label: "প্রশ্নোত্তর", href: "/qa" },
  { label: "বয়ান", href: "/lectures" },
  { label: "দু'আ", href: "/dua" },
  { label: "যাকাত ক্যালকুলেশন", href: "/zakat" },
  { label: "নামাজের সময়", href: "/prayer-times" },
] as const;

export const quickLinks = [
  { label: "কুরআন", href: "/quran", icon: "📖" },
  { label: "হাদীস", href: "/hadith", icon: "📜" },
  { label: "মাসয়ালা-মাসায়েল", href: "/masail", icon: "⚖️" },
  { label: "জীবনী", href: "/biography", icon: "👤" },
  { label: "সীরাত", href: "/seerah", icon: "🌙" },
  { label: "প্রবন্ধ", href: "/articles", icon: "✍️" },
  { label: "প্রশ্নোত্তর", href: "/qa", icon: "❓" },
  { label: "দু'আ", href: "/dua", icon: "🤲" },
  { label: "লাইব্রেরি", href: "/library", icon: "📚" },
  { label: "নামাজের সময়", href: "/prayer-times", icon: "🕌" },
] as const;

export const footerLinks = [
  { label: "কুরআন", href: "/quran" },
  { label: "হাদীস", href: "/hadith" },
  { label: "নামাজের সময়", href: "/prayer-times" },
] as const;

/** Section routes that exist as placeholders until each module is built. */
export const sectionPages: Record<string, string> = {
  quran: "কুরআন",
  hadith: "হাদীস",
  masail: "মাসয়ালা-মাসায়েল",
  seerah: "সীরাত",
  biography: "জীবনী",
  articles: "প্রবন্ধ",
  qa: "প্রশ্নোত্তর",
  lectures: "বয়ান",
  dua: "দু'আ",
  zakat: "যাকাত ক্যালকুলেশন",
  "prayer-times": "নামাজের সময়",
  library: "লাইব্রেরি",
  ask: "প্রশ্ন জিজ্ঞাসা করুন",
  search: "অনুসন্ধান",
  app: "অ্যাপ ডাউনলোড",
};
