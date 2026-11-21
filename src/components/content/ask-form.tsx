"use client";
import { useActionState } from "react";
import { keepValues } from "@/lib/keep-form";
import Link from "next/link";
import { submitQuestion } from "@/app/actions/ask";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { SubmitButton } from "@/components/ui/submit-button";
import { FieldError, FormMessage } from "@/components/ui/form-message";
import { Captcha } from "@/components/auth/captcha";

export function AskForm({ categories, defaultEmail, defaultName }: { categories: { id: string; name_bn: string }[]; defaultEmail?: string; defaultName?: string }) {
  const [state, action, pending] = useActionState(submitQuestion, null);
  if (state?.ok) {
    return (
      <div className="space-y-4 text-center">
        <FormMessage state={state} />
        <div className="flex flex-wrap justify-center gap-3 text-sm">
          <Link href="/qa" className="rounded-full bg-primary px-5 py-2 font-semibold text-white">প্রশ্নোত্তর পড়ুন</Link>
          <button type="button" onClick={() => location.reload()} className="rounded-full border px-5 py-2 font-semibold">আরেকটি প্রশ্ন করুন</button>
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">নাম <span className="font-normal text-muted-foreground">(ঐচ্ছিক, প্রকাশ হবে না)</span></Label>
          <Input id="name" name="name" defaultValue={defaultName} autoComplete="name" placeholder="ঐচ্ছিক — প্রকাশ করা হবে না" className="rounded-lg" />
        </div>
        <div>
          <Label htmlFor="email">ইমেইল <span className="font-normal text-muted-foreground">(উত্তর জানানোর জন্য)</span></Label>
          <Input id="email" name="email" type="email" required defaultValue={defaultEmail} autoComplete="email" placeholder="example@gmail.com" className="rounded-lg" />
          <FieldError state={state} name="email" />
        </div>
      </div>
      <div>
        <Label htmlFor="category_id">বিষয়</Label>
        <NativeSelect id="category_id" name="category_id" defaultValue="">
          <option value="">— বিষয় বেছে নিন (ঐচ্ছিক) —</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name_bn}</option>)}
        </NativeSelect>
      </div>
      <div>
        <Label htmlFor="title">প্রশ্নের শিরোনাম</Label>
        <Input id="title" name="title" required maxLength={200} placeholder="যেমন: সফরে কসর নামায কত দূরত্বে পড়তে হয়?" className="rounded-lg" />
        <FieldError state={state} name="title" />
      </div>
      <div>
        <Label htmlFor="question">বিস্তারিত প্রশ্ন</Label>
        <Textarea id="question" name="question" required rows={8} maxLength={5000} placeholder="আপনার পরিস্থিতি সহজ ভাষায় লিখুন। কারো নাম বা ব্যক্তিগত পরিচয় লিখবেন না।" />
        <FieldError state={state} name="question" />
      </div>
      <fieldset className="space-y-2 rounded-xl border bg-secondary/30 p-4 text-sm">
        <legend className="px-1 font-medium">উত্তর প্রকাশ</legend>
        <label className="flex items-start gap-2">
          <input type="radio" name="privacy" value="public" defaultChecked className="mt-1 accent-[var(--primary)]" />
          <span>সবার উপকারের জন্য প্রশ্নোত্তর ওয়েবসাইটে প্রকাশ করা যাবে <span className="text-muted-foreground">(আপনার নাম-ইমেইল কখনো প্রকাশ হবে না)</span></span>
        </label>
        <label className="flex items-start gap-2">
          <input type="radio" name="privacy" value="private" className="mt-1 accent-[var(--primary)]" />
          <span>শুধু আমাকে উত্তর জানান, প্রকাশ করবেন না</span>
        </label>
        <label className="flex items-start gap-2 border-t pt-2">
          <input type="checkbox" name="notify" defaultChecked className="mt-1 accent-[var(--primary)]" />
          <span>উত্তর দেওয়া হলে আমাকে ইমেইলে জানান</span>
        </label>
      </fieldset>
      <Captcha resetKey={state} error={state?.fieldErrors?.captcha_answer?.[0]} />
      <SubmitButton pending={pending} size="lg" className="w-full" pendingText="জমা হচ্ছে…">প্রশ্ন জমা দিন</SubmitButton>
    </form>
  );
}
