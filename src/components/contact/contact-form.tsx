"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { keepValues } from "@/lib/keep-form";
import { sendContactMessage } from "@/app/actions/contact";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { SubmitButton } from "@/components/ui/submit-button";
import { FieldError, FormMessage } from "@/components/ui/form-message";
import { Captcha } from "@/components/auth/captcha";
import { CONTACT_TOPICS } from "@/config/contact";
import { toBnDigits } from "@/lib/utils";
import type { CaptchaChallenge } from "@/lib/captcha-types";

export function ContactForm({
  captcha, defaultName, defaultEmail, defaultTopic, defaultPage,
}: { captcha?: CaptchaChallenge; defaultName?: string; defaultEmail?: string; defaultTopic?: string; defaultPage?: string }) {
  const [state, action, pending] = useActionState(sendContactMessage, null);
  const [topic, setTopic] = useState(defaultTopic && CONTACT_TOPICS.some((t) => t.value === defaultTopic) ? defaultTopic : "general");
  const [len, setLen] = useState(0);

  if (state?.ok) {
    return (
      <div className="py-6 text-center">
        <CheckCircle2 className="mx-auto size-14 text-primary" aria-hidden />
        <h2 className="mt-3 text-xl font-bold text-primary">বার্তা পাঠানো হয়েছে</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{state.message}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3 text-sm">
          <Link href="/" className="rounded-full bg-primary px-5 py-2 font-semibold text-white hover:bg-brand-deep">হোমপেজে যান</Link>
          <button type="button" onClick={() => location.reload()} className="rounded-full border px-5 py-2 font-semibold hover:bg-muted">আরেকটি বার্তা লিখুন</button>
        </div>
      </div>
    );
  }

  return (
    <form action={action} onSubmit={keepValues(action)} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <div aria-hidden className="absolute -left-[9999px]">
        <label>Website <input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      {defaultPage && <input type="hidden" name="page_url" value={defaultPage} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">আপনার নাম</Label>
          <Input id="name" name="name" required maxLength={80} defaultValue={defaultName} autoComplete="name" placeholder="পূর্ণ নাম" className="rounded-lg" />
          <FieldError state={state} name="name" />
        </div>
        <div>
          <Label htmlFor="email">ইমেইল</Label>
          <Input id="email" name="email" type="email" required defaultValue={defaultEmail} autoComplete="email" placeholder="example@gmail.com" className="rounded-lg" />
          <FieldError state={state} name="email" />
        </div>
      </div>

      <div>
        <Label htmlFor="topic">বার্তার ধরন</Label>
        <NativeSelect id="topic" name="topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
          {CONTACT_TOPICS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </NativeSelect>
        {topic === "correction" && (
          <p className="mt-1.5 text-xs text-muted-foreground">কোন পাতায় ভুল, কী ভুল এবং সঠিক তথ্যের সূত্র (কিতাব/হাদীস নম্বর) লিখলে যাচাই করা সহজ হয়।</p>
        )}
      </div>

      <div>
        <Label htmlFor="subject">বিষয়</Label>
        <Input id="subject" name="subject" required maxLength={150} placeholder="সংক্ষেপে বিষয়টি লিখুন" className="rounded-lg" />
        <FieldError state={state} name="subject" />
      </div>

      <div>
        <Label htmlFor="message">বার্তা</Label>
        <Textarea id="message" name="message" required rows={7} maxLength={5000} onChange={(e) => setLen(e.target.value.length)} placeholder="বিস্তারিত লিখুন…" />
        <div className="mt-1 flex justify-between gap-2">
          <FieldError state={state} name="message" />
          <span className="ml-auto text-xs text-muted-foreground">{toBnDigits(len)}/৫০০০</span>
        </div>
      </div>

      <Captcha initial={captcha} resetKey={state} error={state?.fieldErrors?.captcha_answer?.[0]} />
      <SubmitButton pending={pending} size="lg" className="w-full" pendingText="পাঠানো হচ্ছে…">বার্তা পাঠান</SubmitButton>
      <p className="text-center text-xs text-muted-foreground">
        বার্তা পাঠানোর মাধ্যমে আপনি আমাদের <Link href="/privacy" className="text-primary hover:underline">গোপনীয়তা নীতি</Link> মেনে নিচ্ছেন।
      </p>
    </form>
  );
}
