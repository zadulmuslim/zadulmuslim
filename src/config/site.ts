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
    email: "zadulmuslim026@gmail.com",
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

/** Footer link columns. */
export const footerColumns = [
  {
    title: "ইলম",
    links: [
      { label: "কুরআন", href: "/quran" },
      { label: "হাদীস", href: "/hadith" },
      { label: "মাসয়ালা-মাসায়েল", href: "/masail" },
      { label: "সীরাত", href: "/seerah" },
      { label: "জীবনী", href: "/biography" },
      { label: "লাইব্রেরি", href: "/library" },
    ],
  },
  {
    title: "প্রশ্নোত্তর ও প্রবন্ধ",
    links: [
      { label: "সব প্রশ্নোত্তর", href: "/qa" },
      { label: "প্রশ্ন করুন", href: "/ask" },
      { label: "প্রবন্ধ", href: "/articles" },
      { label: "আধুনিক মাসায়েল", href: "/qa?category=modern-masail" },
      { label: "বিবাহ ও পরিবার", href: "/qa?category=nikah-family" },
      { label: "অনুসন্ধান", href: "/search" },
    ],
  },
  {
    title: "আমল ও টুলস",
    links: [
      { label: "নামাজের সময়", href: "/prayer-times" },
      { label: "দু'আ", href: "/dua" },
      { label: "যাকাত ক্যালকুলেশন", href: "/zakat" },
      { label: "বয়ান", href: "/lectures" },
      { label: "আমার অ্যাকাউন্ট", href: "/account" },
    ],
  },
] as const;

export const legalLinks = [
  { label: "গোপনীয়তা নীতি", href: "/privacy" },
  { label: "ব্যবহারের শর্তাবলি", href: "/terms" },
] as const;

/** Section routes that exist as placeholders until each module is built. */
export const sectionPages: Record<string, string> = {
  masail: "মাসয়ালা-মাসায়েল",
  seerah: "সীরাত",
  biography: "জীবনী",
  lectures: "বয়ান",
  library: "লাইব্রেরি",
  app: "অ্যাপ ডাউনলোড",
};

/** Grouped navigation for the desktop mega menu and the mobile drawer. */
export interface NavLink {
  label: string;
  href: string;
  description?: string;
  icon?: string;
}
export interface NavGroup {
  label: string;
  href: string;
  description: string;
  columns: { title: string; links: NavLink[] }[];
  feature?: { title: string; body: string; href: string; cta: string };
}

export const navGroups: NavGroup[] = [
  {
    label: "ইলম",
    href: "/quran",
    description: "কুরআন, হাদীস, সীরাত ও ইসলামী জ্ঞানভান্ডার",
    columns: [
      {
        title: "মূল উৎস",
        links: [
          { label: "কুরআন", href: "/quran", description: "তিলাওয়াত, অনুবাদ ও তাফসীর", icon: "📖" },
          { label: "হাদীস", href: "/hadith", description: "সহীহ হাদীস সংকলন", icon: "📜" },
          { label: "মাসয়ালা-মাসায়েল", href: "/masail", description: "বিষয়ভিত্তিক ফিকহী মাসআলা", icon: "⚖️" },
        ],
      },
      {
        title: "ইতিহাস ও জীবনী",
        links: [
          { label: "সীরাত", href: "/seerah", description: "রাসূলুল্লাহ ﷺ-এর জীবনী", icon: "🌙" },
          { label: "জীবনী", href: "/biography", description: "সাহাবী, তাবেয়ী ও আলেমগণ", icon: "👤" },
          { label: "লাইব্রেরি", href: "/library", description: "বই ও ডাউনলোডযোগ্য রিসোর্স", icon: "📚" },
        ],
      },
    ],
    feature: { title: "বয়ান ও ভিডিও", body: "নির্ভরযোগ্য আলেমদের বয়ান, দরস ও হামদ-নাত।", href: "/lectures", cta: "বয়ান দেখুন" },
  },
  {
    label: "প্রশ্নোত্তর",
    href: "/qa",
    description: "বিজ্ঞ আলেমগণের শরয়ী সমাধান",
    columns: [
      {
        title: "বিষয়",
        links: [
          { label: "নামায ও পবিত্রতা", href: "/qa?category=salah-taharah" },
          { label: "বিবাহ ও পরিবার", href: "/qa?category=nikah-family" },
          { label: "আধুনিক মাসায়েল", href: "/qa?category=modern-masail" },
          { label: "আকিদা ও ঈমান", href: "/qa?category=aqidah-iman" },
        ],
      },
      {
        title: "আরও বিষয়",
        links: [
          { label: "রোযা", href: "/qa?category=sawm" },
          { label: "যাকাত", href: "/qa?category=zakat" },
          { label: "ক্রয়-বিক্রয়", href: "/qa?category=trade" },
          { label: "সব প্রশ্নোত্তর", href: "/qa" },
        ],
      },
    ],
    feature: { title: "আপনার প্রশ্ন আছে?", body: "নাম গোপন রেখে প্রশ্ন পাঠান — আলেমগণ কুরআন-সুন্নাহর আলোকে উত্তর দেবেন।", href: "/ask", cta: "প্রশ্ন করুন" },
  },
  {
    label: "প্রবন্ধ",
    href: "/articles",
    description: "গবেষণাধর্মী ও সহজবোধ্য প্রবন্ধ",
    columns: [
      {
        title: "বিষয়ভিত্তিক",
        links: [
          { label: "আকিদা ও ঈমান", href: "/articles?category=aqidah" },
          { label: "ফিকহ ও মাযহাব", href: "/articles?category=fiqh" },
          { label: "ইবাদত ও আমল", href: "/articles?category=ibadah" },
        ],
      },
      {
        title: "জীবন ও সমাজ",
        links: [
          { label: "আত্মশুদ্ধি", href: "/articles?category=tazkiyah" },
          { label: "পরিবার ও সমাজ", href: "/articles?category=family" },
          { label: "আধুনিক সমস্যা", href: "/articles?category=contemporary" },
        ],
      },
    ],
    feature: { title: "সব প্রবন্ধ", body: "নতুন প্রকাশিত প্রবন্ধগুলো এক জায়গায় পড়ুন।", href: "/articles", cta: "প্রবন্ধ পড়ুন" },
  },
  {
    label: "আমল ও টুলস",
    href: "/dua",
    description: "দৈনন্দিন আমলের সহায়ক",
    columns: [
      {
        title: "দৈনন্দিন",
        links: [
          { label: "নামাজের সময়", href: "/prayer-times", description: "আপনার এলাকার ওয়াক্ত", icon: "🕌" },
          { label: "দু'আ", href: "/dua", description: "কুরআন-হাদীসের দু'আ", icon: "🤲" },
        ],
      },
      {
        title: "হিসাব",
        links: [
          { label: "যাকাত ক্যালকুলেশন", href: "/zakat", description: "সহজে যাকাতের হিসাব", icon: "🧮" },
          { label: "বয়ান", href: "/lectures", description: "অডিও ও ভিডিও", icon: "🎧" },
        ],
      },
    ],
  },
];
