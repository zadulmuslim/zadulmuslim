import Link from "next/link";
import { Info } from "lucide-react";

/** Shown under every answer/article. */
export function EditorialNote() {
  return (
    <aside className="mt-8 flex gap-3 rounded-xl border border-accent/40 bg-gold-soft/40 px-4 py-3 text-sm leading-relaxed">
      <Info className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
      <p>
        <strong>সম্পাদকীয় সংকলন — আলেমগণের যাচাই সাপেক্ষ।</strong> এই লেখাটি নির্ভরযোগ্য গ্রন্থ ও ফতোয়া থেকে সংকলিত সাধারণ দিকনির্দেশনা।
        আপনার নির্দিষ্ট পরিস্থিতির জন্য একজন বিজ্ঞ মুফতীর পরামর্শ নিন, অথবা <Link href="/ask" className="font-semibold text-primary underline">আমাদের প্রশ্ন করুন</Link>।
      </p>
    </aside>
  );
}
