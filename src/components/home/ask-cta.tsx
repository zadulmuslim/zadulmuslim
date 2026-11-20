import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AskCta() {
  return (
    <section aria-labelledby="ask-title" className="mx-auto max-w-6xl px-4 pt-14">
      <div className="flex flex-col gap-6 rounded-2xl border-l-8 border-accent bg-brand-deep p-8 text-white shadow-lg md:flex-row md:items-center md:justify-between md:p-10">
        <div>
          <h2 id="ask-title" className="text-2xl font-bold md:text-3xl">বিজ্ঞ আলেমগণের কাছ থেকে শরয়ী সমাধান নিন</h2>
          <ul className="mt-4 space-y-1.5 text-sm text-white/85">
            <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-accent" aria-hidden />নির্ভরযোগ্য আলেমদের মাধ্যমে সমাধান</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-accent" aria-hidden />সম্পূর্ণ গোপনীয়তা রক্ষা করা হয়</li>
          </ul>
        </div>
        <div className="shrink-0 text-center">
          <Button asChild variant="gold" size="lg">
            <Link href="/ask">আপনার প্রশ্ন জিজ্ঞাসা করুন</Link>
          </Button>
          <p className="mt-2 text-xs text-white/75">১,৫০,০০০+ প্রশ্নের সমাধান দেওয়া হয়েছে</p>
        </div>
      </div>
    </section>
  );
}
