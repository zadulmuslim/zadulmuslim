/**
 * Homepage content from the approved design.
 * Q&A and articles now come from Supabase (src/lib/content.ts).
 * Lectures move to the database in a later phase.
 *
 * Homepage statistics come from the database (see getHomepageData).
 */

export const askSteps = [
  { title: "প্রশ্ন লিখুন", body: "নাম গোপন রেখে আপনার মাসআলাটি সহজ ভাষায় লিখে পাঠান।" },
  { title: "আলেমগণ যাচাই করবেন", body: "অভিজ্ঞ মুফতী ও আলেমগণ কুরআন-সুন্নাহর আলোকে উত্তর প্রস্তুত করবেন।" },
  { title: "উত্তর পান", body: "উত্তর প্রস্তুত হলে ওয়েবসাইটে প্রকাশ করা হবে, আর চাইলে ইমেইলে জানিয়ে দেওয়া হবে।" },
] as const;

/** Lecture collections shown as a teaser until the lectures module is published. */
export const lectures = [
  { title: "ভিডিও বয়ান", body: "নির্ভরযোগ্য আলেমদের বয়ান ও নসীহত", kind: "video" as const },
  { title: "দরস ও তাফসীর", body: "কুরআন-হাদীসের ধারাবাহিক দরস", kind: "video" as const },
  { title: "হামদ ও নাত", body: "নির্বাচিত হামদ, নাত ও নাশীদ", kind: "nasheed" as const },
];

