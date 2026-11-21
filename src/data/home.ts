/**
 * Homepage content from the approved design.
 * Q&A and articles now come from Supabase (src/lib/content.ts).
 * Lectures move to the database in a later phase.
 *
 * NOTE: `stats` and `testimonials` are design placeholders. Replace them with
 * real figures and genuine reader feedback before launch.
 */

export const askSteps = [
  { title: "প্রশ্ন লিখুন", body: "নাম গোপন রেখে আপনার মাসআলাটি সহজ ভাষায় লিখে পাঠান।" },
  { title: "আলেমগণ যাচাই করবেন", body: "অভিজ্ঞ মুফতী ও আলেমগণ কুরআন-সুন্নাহর আলোকে উত্তর প্রস্তুত করবেন।" },
  { title: "উত্তর পান", body: "ইনশাআল্লাহ ২৪-৭২ ঘণ্টার মধ্যে ওয়েবসাইট ও ইমেইলে উত্তর পাবেন।" },
] as const;

/** PLACEHOLDER figures from the design — replace with real numbers before launch. */
export const stats = [
  { value: "৪,৫০০+", label: "প্রশ্নোত্তর" },
  { value: "১,৫০,০০০+", label: "সমাধানকৃত প্রশ্ন" },
  { value: "৫০ লক্ষ+", label: "অ্যাপ ডাউনলোড" },
  { value: "৪.৯", label: "গড় রেটিং" },
] as const;

export const lectures = [
  { title: "ফিকহে হানাফী: দলীলসহ পরিচিতি", kind: "video" as const },
  { title: "আত্মশুদ্ধির পথে প্রতিদিনের আমল", kind: "video" as const },
  { title: "হামদ ও নাত সংকলন", kind: "nasheed" as const },
];

/** PLACEHOLDER testimonials from the design — publish only genuine reader feedback. */
export const testimonials = [
  { quote: "নামাজের সময়, তাফসীর, দু'আ — সব এক জায়গায়। দৈনন্দিন ইলমের সবচেয়ে বিশ্বস্ত উৎস।", name: "আহমেদ রহমান" },
  { quote: "আলেমদের কাছ থেকে সরাসরি উত্তর পেয়ে খুবই উপকৃত হয়েছি।", name: "মোহাম্মদ কবির" },
] as const;

export const appStores = [
  { label: "Google Play", href: "#" },
  { label: "App Store", href: "#" },
  { label: "Windows", href: "#" },
] as const;
