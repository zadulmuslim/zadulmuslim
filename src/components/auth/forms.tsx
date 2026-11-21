"use client";
import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, signIn, signUp, updatePassword } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { FieldError, FormMessage } from "@/components/ui/form-message";

const field = "rounded-lg";

export function LoginForm({ next, linkError }: { next?: string; linkError?: boolean }) {
  const [state, action] = useActionState(signIn, linkError ? { ok: false, message: "লিংকটি অকার্যকর বা মেয়াদোত্তীর্ণ। আবার চেষ্টা করুন।" } : null);
  return (
    <form action={action} className="space-y-4" noValidate>
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
        <Input id="password" name="password" type="password" autoComplete="current-password" required className={field} />
        <FieldError state={state} name="password" />
      </div>
      <SubmitButton className="w-full" pendingText="লগইন হচ্ছে…">লগইন</SubmitButton>
    </form>
  );
}

export function SignupForm() {
  const [state, action] = useActionState(signUp, null);
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-4" noValidate>
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
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className={field} />
        <FieldError state={state} name="password" />
      </div>
      <div>
        <Label htmlFor="confirm">পাসওয়ার্ড আবার লিখুন</Label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required className={field} />
        <FieldError state={state} name="confirm" />
      </div>
      <SubmitButton className="w-full" pendingText="অ্যাকাউন্ট খোলা হচ্ছে…">অ্যাকাউন্ট খুলুন</SubmitButton>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, null);
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <div>
        <Label htmlFor="email">অ্যাকাউন্টের ইমেইল</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required className={field} />
      </div>
      <SubmitButton className="w-full" pendingText="পাঠানো হচ্ছে…">রিসেট লিংক পাঠান</SubmitButton>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action] = useActionState(updatePassword, null);
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <div>
        <Label htmlFor="password">নতুন পাসওয়ার্ড</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className={field} />
        <FieldError state={state} name="password" />
      </div>
      <div>
        <Label htmlFor="confirm">নতুন পাসওয়ার্ড আবার লিখুন</Label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required className={field} />
        <FieldError state={state} name="confirm" />
      </div>
      <SubmitButton className="w-full" pendingText="সংরক্ষণ হচ্ছে…">পাসওয়ার্ড পরিবর্তন করুন</SubmitButton>
    </form>
  );
}
