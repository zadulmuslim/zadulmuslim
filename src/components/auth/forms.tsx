"use client";
import { useActionState } from "react";
import { keepValues } from "@/lib/keep-form";
import Link from "next/link";
import { requestPasswordReset, signIn, signUp, updatePassword } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { FieldError, FormMessage, type FormState } from "@/components/ui/form-message";
import { PasswordInput } from "@/components/ui/password-input";
import { Captcha } from "./captcha";

const field = "rounded-lg";

export function LoginForm({ next, initialState = null }: { next?: string; initialState?: FormState }) {
  const [state, action, pending] = useActionState(signIn, initialState);
  return (
    <form action={action} onSubmit={keepValues(action)} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <FormMessage state={state} />
      <div>
        <Label htmlFor="email">ইমেইল</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required className={field} />
        <FieldError state={state} name="email" />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <Label htmlFor="password">পাসওয়ার্ড</Label>
          <Link href="/forgot-password" className="text-xs text-primary hover:underline">পাসওয়ার্ড ভুলে গেছেন?</Link>
        </div>
        <PasswordInput id="password" name="password" autoComplete="current-password" required className={field} />
        <FieldError state={state} name="password" />
      </div>
      <Captcha resetKey={state} error={state?.fieldErrors?.captcha_answer?.[0]} />
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" name="remember" className="size-4 accent-[var(--primary)]" />
        <span>আমাকে মনে রাখুন <span className="text-xs text-muted-foreground">(নিজের ডিভাইসে টিক দিন)</span></span>
      </label>
      <SubmitButton pending={pending} className="w-full" pendingText="লগইন হচ্ছে…">লগইন</SubmitButton>
    </form>
  );
}

export function SignupForm() {
  const [state, action, pending] = useActionState(signUp, null);
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <form action={action} onSubmit={keepValues(action)} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <div>
        <Label htmlFor="name">নাম</Label>
        <Input id="name" name="name" autoComplete="name" required className={field} />
        <FieldError state={state} name="name" />
      </div>
      <div>
        <Label htmlFor="email">ইমেইল</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required className={field} />
        <FieldError state={state} name="email" />
      </div>
      <div>
        <Label htmlFor="password">পাসওয়ার্ড</Label>
        <PasswordInput id="password" name="password" autoComplete="new-password" minLength={8} required className={field} />
        <FieldError state={state} name="password" />
      </div>
      <div>
        <Label htmlFor="confirm">পাসওয়ার্ড আবার লিখুন</Label>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" required className={field} />
        <FieldError state={state} name="confirm" />
      </div>
      <Captcha resetKey={state} error={state?.fieldErrors?.captcha_answer?.[0]} />
      <SubmitButton pending={pending} className="w-full" pendingText="অ্যাকাউন্ট খোলা হচ্ছে…">অ্যাকাউন্ট খুলুন</SubmitButton>
    </form>
  );
}

export function ForgotPasswordForm({ initialState = null }: { initialState?: FormState }) {
  const [state, action, pending] = useActionState(requestPasswordReset, initialState);
  return (
    <form action={action} onSubmit={keepValues(action)} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <div>
        <Label htmlFor="email">অ্যাকাউন্টের ইমেইল</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required className={field} />
      </div>
      <Captcha resetKey={state} error={state?.fieldErrors?.captcha_answer?.[0]} />
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
        <PasswordInput id="password" name="password" autoComplete="new-password" minLength={8} required className={field} />
        <FieldError state={state} name="password" />
      </div>
      <div>
        <Label htmlFor="confirm">নতুন পাসওয়ার্ড আবার লিখুন</Label>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" required className={field} />
        <FieldError state={state} name="confirm" />
      </div>
      <SubmitButton pending={pending} className="w-full" pendingText="সংরক্ষণ হচ্ছে…">পাসওয়ার্ড পরিবর্তন করুন</SubmitButton>
    </form>
  );
}
