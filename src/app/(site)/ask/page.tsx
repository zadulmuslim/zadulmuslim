import { issueChallenge } from "@/lib/captcha";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { getQuestionCategories } from "@/lib/content";
import { getSessionUser } from "@/lib/auth/session";
import { AskForm } from "@/components/content/ask-form";
import { Breadcrumbs } from "@/components/content/breadcrumbs";
import { askSteps } from "@/data/home";
import { toBnDigits } from "@/lib/utils";

export const metadata: Metadata = {
  title: "প্রশ্ন জিজ্ঞাসা করুন",
  description: "নাম গোপন রেখে আপনার শরয়ী প্রশ্ন পাঠান — বিজ্ঞ আলেমগণ কুরআন-সুন্নাহর আলোকে উত্তর দেবেন।",
  alternates: { canonical: "/ask" },
};

export default async function AskPage() {
  const [categories, user] = await Promise.all([getQuestionCategories(), getSessionUser()]);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
      <Breadcrumbs items={[{ label: "হোম", href: "/" }, { label: "প্রশ্ন জিজ্ঞাসা করুন" }]} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-2xl border border-t-4 border-t-accent bg-card p-6 shadow-sm md:p-8">
          <h1 className="text-2xl font-bold text-primary md:text-3xl">আপনার প্রশ্ন জিজ্ঞাসা করুন</h1>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">উত্তর দেওয়ার আগে আলেমগণ প্রশ্নটি যাচাই করবেন। প্রশ্ন পাঠানোর আগে <a href="/qa" className="text-primary underline">প্রশ্নোত্তর</a> অংশে খুঁজে দেখুন — হয়তো উত্তর আগেই দেওয়া আছে।</p>
          <AskForm captcha={issueChallenge()} categories={categories} defaultEmail={user?.email ?? undefined} defaultName={user?.displayName ?? undefined} />
        </section>
        <aside className="space-y-4">
          <div className="rounded-2xl bg-brand-deep p-6 text-white">
            <h2 className="font-bold text-accent">কীভাবে কাজ করে</h2>
            <ol className="mt-4 space-y-4">
              {askSteps.map((s, i) => (
                <li key={s.title} className="flex gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent text-sm font-bold text-brand-deep">{toBnDigits(i + 1)}</span>
                  <span><span className="block font-semibold">{s.title}</span><span className="text-sm text-white/80">{s.body}</span></span>
                </li>
              ))}
            </ol>
          </div>
          <ul className="space-y-2 rounded-2xl border bg-card p-5 text-sm">
            {["আপনার নাম ও ইমেইল কখনো প্রকাশ করা হয় না", "অন্যের নাম বা পরিচয় প্রশ্নে লিখবেন না", "জরুরি বা জটিল বিষয়ে সরাসরি স্থানীয় মুফতীর সাথে যোগাযোগ করুন"].map((t) => (
              <li key={t} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />{t}</li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
