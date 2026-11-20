/**
 * Homepage content from the approved design.
 * Questions, articles and lectures will come from Supabase once the
 * content is entered; this file keeps the page working until then.
 *
 * NOTE: `stats` and `testimonials` are design placeholders. Replace them with
 * real figures and genuine reader feedback before launch.
 */

export const qaGroups = [
  {
    title: "নামায ও পবিত্রতা",
    slug: "salah-taharah",
    questions: [
      "কোন মোজার উপর মাসাহ করা যাবে?",
      "অ্যাম্বুলেন্সে লাশ রেখে জানাযা পড়া যাবে?",
      "বিতর নামায পড়ার সহীহ নিয়ম কী?",
    ],
  },
  {
    title: "বিবাহ ও পরিবার",
    slug: "nikah-family",
    questions: [
      "মৌখিক ইজাব কবুল ছাড়া কাবিননামায় সাইন করলে বিবাহ হয় কি?",
      "তালাকের পর সন্তানের লালন-পালনের দায়িত্ব কার?",
      "পিতা-মাতার সাথে সন্তানের আকীকা এক পশুতে করা যাবে?",
    ],
  },
  {
    title: "আধুনিক মাসায়েল",
    slug: "modern-masail",
    questions: [
      "ল্যাবরেটরিতে প্রস্তুত গোস্ত খাওয়া কি হালাল?",
      "বিটকয়েন ও ডিজিটাল কারেন্সি ক্রয়বিক্রয়ের হুকুম",
      "ভাড়া ঠিক না করে রিকশায় উঠলে করণীয় কী?",
    ],
  },
  {
    title: "আকিদা ও ঈমান",
    slug: "aqidah-iman",
    questions: [
      "কালিমা আরবিতে শুদ্ধ না পড়তে পারলে কি মুসলমান থাকা যায়?",
      "দুনিয়াবী উপকারের আশায় ইবাদত করলে কবুল হবে কি?",
      "ইমাম আবূ হানীফা (রহ.)-এর পাঁচ হাদীসের নসীহত",
    ],
  },
] as const;

export const recentQuestions = [
  { title: "জান্নাতে যেতে একটি নেক আমলই কি যথেষ্ট?", date: "৯ অক্টোবর ২০২৬" },
  { title: "মৌখিক ইজাব কবুল ও কাবিননামা", date: "৮ অক্টোবর ২০২৬" },
  { title: "রিকশা ভাড়া ও চুক্তি", date: "৬ অক্টোবর ২০২৬" },
] as const;

export const topics = [
  { label: "নামায", slug: "salah-taharah" },
  { label: "রোযা", slug: "sawm" },
  { label: "যাকাত", slug: "zakat" },
  { label: "হজ্ব", slug: "hajj" },
  { label: "বিবাহ", slug: "nikah-family" },
  { label: "ক্রয়-বিক্রয়", slug: "trade" },
  { label: "মিরাস", slug: "inheritance" },
  { label: "দু'আ", slug: "dua" },
] as const;

export const articleCategories = [
  { slug: "aqidah", count: "১২০+", title: "আকিদা ও ঈমান", description: "ঈমানের মৌলিক বিষয়, আহলুস সুন্নাহর আকিদা ও সংশয় নিরসন।", latest: "ইমাম আবূ হানীফা (রহ.)-এর আকিদা", minutes: "৬" },
  { slug: "fiqh", count: "২১০+", title: "ফিকহ ও মাযহাব", description: "হানাফী ফিকহের পরিচিতি, উসূল, দলীল ও ইখতিলাফের আদব।", latest: "তাকলীদ কেন জরুরি?", minutes: "৮" },
  { slug: "ibadah", count: "১৮০+", title: "ইবাদত ও আমল", description: "নামায, রোযা, যাকাত ও হজ্বের নিয়ম ও ফযীলত।", latest: "নামাযের খুশূ ও একাগ্রতা", minutes: "৫" },
  { slug: "tazkiyah", count: "৯০+", title: "আত্মশুদ্ধি", description: "অন্তরের রোগ, তাওবা, সবর ও শুকরের বাস্তব নির্দেশনা।", latest: "গীবত থেকে বাঁচার উপায়", minutes: "৪" },
  { slug: "family", count: "১৪০+", title: "পরিবার ও সমাজ", description: "বিবাহ, সন্তান প্রতিপালন, পিতা-মাতার হক ও সামাজিক আদব।", latest: "স্বামী-স্ত্রীর পারস্পরিক হক", minutes: "৭" },
  { slug: "contemporary", count: "৭০+", title: "আধুনিক সমস্যা", description: "প্রযুক্তি, অর্থনীতি ও সমকালীন বিষয়ে শরয়ী দৃষ্টিভঙ্গি।", latest: "ডিজিটাল লেনদেনের শরয়ী বিধান", minutes: "৯" },
] as const;

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
