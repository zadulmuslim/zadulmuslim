"use client";
import { useActionState } from "react";
import { keepValues } from "@/lib/keep-form";
import Link from "next/link";
import { requestPasswordReset, signIn, signUp, updatePassword, changePassword } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { FieldError, FormMessage, type FormState } from "@/components/ui/form-message";
import { PasswordInput } from "@/components/ui/password-input";
import { Captcha } from "./captcha";
import type { CaptchaChallenge } from "@/lib/captcha-types";

const field = "rounded-lg";

export function LoginForm({ next, initialState = null, captcha }: { next?: string; initialState?: FormState; captcha?: CaptchaChallenge }) {
  const [state, action, pending] = useActionState(signIn, initialState);
  return (
    <form action={action} onSubmit={keepValues(action)} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <FormMessage state={state} />
      <div>
        <Label htmlFor="email">ইমেইল</Label>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="example@gmail.com" required className={field} />
        <FieldError state={state} name="email" />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <Label htmlFor="password">পাসওয়ার্ড</Label>
          <Link href="/forgot-password" className="text-xs text-primary hover:underline">পাসওয়ার্ড ভুলে গেছেন?</Link>
        </div>
        <PasswordInput id="password" name="password" autoComplete="current-password" placeholder="আপনার পাসওয়ার্ড" required className={field} />
        <FieldError state={state} name="password" />
      </div>
      <Captcha initial={captcha} resetKey={state} error={state?.fieldErrors?.captcha_answer?.[0]} />
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" name="remember" className="size-4 accent-[var(--primary)]" />
        <span>আমাকে মনে রাখুন <span className="text-xs text-muted-foreground">(নিজের ডিভাইসে টিক দিন)</span></span>
      </label>
      <SubmitButton pending={pending} className="w-full" pendingText="লগইন হচ্ছে…">লগইন</SubmitButton>
    </form>
  );
}

export function SignupForm({ captcha }: { captcha?: CaptchaChallenge }) {
  const [state, action, pending] = useActionState(signUp, null);
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <form action={action} onSubmit={keepValues(action)} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <div>
        <Label htmlFor="name">নাম</Label>
        <Input id="name" name="name" autoComplete="name" placeholder="আপনার পূর্ণ নাম" required className={field} />
        <FieldError state={state} name="name" />
      </div>
      <div>
        <Label htmlFor="email">ইমেইল</Label>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="example@gmail.com" required className={field} />
        <FieldError state={state} name="email" />
      </div>
      <div>
        <Label htmlFor="password">পাসওয়ার্ড</Label>
        <PasswordInput id="password" name="password" autoComplete="new-password" minLength={8} placeholder="কমপক্ষে ৮ অক্ষর" required className={field} />
        <FieldError state={state} name="password" />
      </div>
      <div>
        <Label htmlFor="confirm">পাসওয়ার্ড আবার লিখুন</Label>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" placeholder="একই পাসওয়ার্ড আবার লিখুন" required className={field} />
        <FieldError state={state} name="confirm" />
      </div>
      <Captcha initial={captcha} resetKey={state} error={state?.fieldErrors?.captcha_answer?.[0]} />
      <SubmitButton pending={pending} className="w-full" pendingText="অ্যাকাউন্ট খোলা হচ্ছে…">অ্যাকাউন্ট খুলুন</SubmitButton>
    </form>
  );
}

export function ForgotPasswordForm({ initialState = null, captcha }: { initialState?: FormState; captcha?: CaptchaChallenge }) {
  const [state, action, pending] = useActionState(requestPasswordReset, initialState);
  return (
    <form action={action} onSubmit={keepValues(action)} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <div>
        <Label htmlFor="email">অ্যাকাউন্টের ইমেইল</Label>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="example@gmail.com" required className={field} />
      </div>
      <Captcha initial={captcha} resetKey={state} error={state?.fieldErrors?.captcha_answer?.[0]} />
      <SubmitButton pending={pending} className="w-full" pendingText="পাঠানো হচ্ছে…">রিসেট লিংক পাঠান</SubmitButton>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, null);
  return (
    <form action={action} onSubmit={keepValues(action)} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <div>
        <Label htmlFor="password">নতুন পাসওয়ার্ড</Label>
        <PasswordInput id="password" name="password" autoComplete="new-password" minLength={8} placeholder="কমপক্ষে ৮ অক্ষর" required className={field} />
        <FieldError state={state} name="password" />
      </div>
      <div>
        <Label htmlFor="confirm">নতুন পাসওয়ার্ড আবার লিখুন</Label>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" placeholder="একই পাসওয়ার্ড আবার লিখুন" required className={field} />
        <FieldError state={state} name="confirm" />
      </div>
      <SubmitButton pending={pending} className="w-full" pendingText="সংরক্ষণ হচ্ছে…">পাসওয়ার্ড পরিবর্তন করুন</SubmitButton>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, null);
  return (
    <form action={action} onSubmit={keepValues(action)} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="current">বর্তমান পাসওয়ার্ড</Label>
          <Link href="/forgot-password" className="text-xs text-primary hover:underline">মনে নেই?</Link>
        </div>
        <PasswordInput id="current" name="current" autoComplete="current-password" placeholder="এখনকার পাসওয়ার্ড" required className={field} />
        <FieldError state={state} name="current" />
      </div>
      <div>
        <Label htmlFor="password">নতুন পাসওয়ার্ড</Label>
        <PasswordInput id="password" name="password" autoComplete="new-password" minLength={8} placeholder="কমপক্ষে ৮ অক্ষর" required className={field} />
        <FieldError state={state} name="password" />
      </div>
      <div>
        <Label htmlFor="confirm">নতুন পাসওয়ার্ড আবার লিখুন</Label>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" placeholder="একই পাসওয়ার্ড আবার লিখুন" required className={field} />
        <FieldError state={state} name="confirm" />
      </div>
      <SubmitButton pending={pending} className="w-full" pendingText="সংরক্ষণ হচ্ছে…">পাসওয়ার্ড পরিবর্তন করুন</SubmitButton>
    </form>
  );
}
