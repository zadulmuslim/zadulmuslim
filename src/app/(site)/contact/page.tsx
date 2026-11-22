import type { Metadata } from "next";
import Link from "next/link";
import { Clock3, HelpCircle, Mail, MapPin, MessageCircleQuestion, ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/content/page-hero";
import { ContactForm } from "@/components/contact/contact-form";
import { issueChallenge } from "@/lib/captcha";
import { getSessionUser } from "@/lib/auth/session";
import { siteConfig } from "@/config/site";
import { safeNextPath } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "যোগাযোগ",
  description: "যাদুল মুসলিমের সঙ্গে যোগাযোগ করুন — পরামর্শ, ভুল সংশোধন, প্রযুক্তিগত সমস্যা বা সহযোগিতার প্রস্তাব।",
  alternates: { canonical: "/contact" },
};

const FAQ = [
  {
    q: "শরঈ মাসআলা জানতে চাই — এখানে লিখব?",
    a: <>না, মাসআলা-সংক্রান্ত প্রশ্ন <Link href="/ask" className="font-semibold text-primary hover:underline">প্রশ্ন করুন</Link> পাতা থেকে পাঠান। সেখান থেকে আলেমগণ প্রশ্ন যাচাই করে উত্তর দেন এবং উত্তর হলে ইমেইলে জানানো হয়।</>,
  },
  {
    q: "কোনো লেখায় ভুল পেলে কী করব?",
    a: <>বার্তার ধরন হিসেবে “ভুল সংশোধন / তথ্যসূত্র” বেছে নিয়ে পাতার লিংক, ভুলটি এবং সঠিক তথ্যের সূত্র লিখুন। যাচাইয়ের পর সংশোধন করা হবে ইনশাআল্লাহ।</>,
  },
  {
    q: "উত্তর পেতে কত সময় লাগে?",
    a: <>সাধারণত কয়েক কর্মদিবসের মধ্যে উত্তর দেওয়ার চেষ্টা করা হয়। বার্তা পাঠানোর সঙ্গে সঙ্গে আপনার ইমেইলে একটি নিশ্চিতকরণ যাবে।</>,
  },
  {
    q: "আমার অ্যাকাউন্ট ও তথ্য মুছে ফেলতে চাই।",
    a: <>“সাধারণ জিজ্ঞাসা” ধরনে অ্যাকাউন্টের ইমেইল থেকে বার্তা পাঠান। যাচাইয়ের পর অ্যাকাউন্ট ও সংশ্লিষ্ট তথ্য মুছে ফেলা হবে। বিস্তারিত দেখুন <Link href="/privacy" className="font-semibold text-primary hover:underline">গোপনীয়তা নীতি</Link>।</>,
  },
];

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ topic?: string; page?: string }> }) {
  const [{ topic, page }, user] = await Promise.all([searchParams, getSessionUser()]);
  const info = [
    { icon: Mail, title: "ইমেইল", body: <a href={`mailto:${siteConfig.contact.email}`} className="break-all font-semibold text-primary hover:underline" dir="ltr">{siteConfig.contact.email}</a> },
    { icon: MapPin, title: "অবস্থান", body: siteConfig.contact.location },
    { icon: Clock3, title: "উত্তরের সময়", body: "সাধারণত কয়েক কর্মদিবসের মধ্যে" },
  ];

  return (
    <>
      <PageHero crumb="যোগাযোগ" title="যোগাযোগ করুন" subtitle="পরামর্শ, ভুল সংশোধন, প্রযুক্তিগত সমস্যা বা সহযোগিতার প্রস্তাব — যেকোনো বিষয়ে আমাদের লিখুন। আপনার মতামত এই প্ল্যাটফর্মকে আরও উপকারী করে তোলে।" />
      <section className="mx-auto -mt-8 max-w-6xl px-4 pb-14">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-3xl border bg-card p-5 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-primary">বার্তা পাঠান</h2>
            <p className="mb-6 mt-1 text-sm text-muted-foreground">সব ঘর পূরণ করুন। আপনার ইমেইল শুধু উত্তর দেওয়ার কাজে ব্যবহার হবে।</p>
            <ContactForm
              captcha={issueChallenge()}
              defaultName={user?.displayName ?? undefined}
              defaultEmail={user?.email ?? undefined}
              defaultTopic={topic}
              defaultPage={page ? safeNextPath(page, "") : undefined}
            />
          </div>

          <aside className="space-y-4">
            <ul className="space-y-3">
              {info.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-3 rounded-2xl border bg-card p-4 shadow-sm">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" aria-hidden /></span>
                  <div className="min-w-0 text-sm">
                    <p className="text-xs text-muted-foreground">{title}</p>
                    <div className="mt-0.5">{body}</div>
                  </div>
                </li>
              ))}
            </ul>

            <Link href="/ask" className="block rounded-2xl bg-gradient-to-br from-brand-deep to-primary p-5 text-white shadow-sm transition hover:shadow-md">
              <MessageCircleQuestion className="size-6 text-accent" aria-hidden />
              <p className="mt-2 font-bold">শরঈ প্রশ্ন আছে?</p>
              <p className="mt-1 text-sm text-white/80">মাসআলা জানতে “প্রশ্ন করুন” পাতা ব্যবহার করুন — আলেমগণ যাচাই করে উত্তর দেবেন।</p>
              <span className="mt-3 inline-flex rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-brand-deep">প্রশ্ন করুন</span>
            </Link>

            <div className="flex gap-3 rounded-2xl border border-dashed bg-card/60 p-4 text-xs text-muted-foreground">
              <ShieldCheck className="size-5 shrink-0 text-primary" aria-hidden />
              আপনার তথ্য গোপন থাকে এবং কোনো তৃতীয় পক্ষের কাছে বিক্রি করা হয় না।
            </div>
          </aside>
        </div>

        <div className="mt-12">
          <h2 className="flex items-center gap-2 text-xl font-bold text-primary"><HelpCircle className="size-5" aria-hidden />সচরাচর জিজ্ঞাসা</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-2xl border bg-card p-4 shadow-sm open:border-primary/30">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold">
                  {f.q}
                  <span className="text-xl leading-none text-primary transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
