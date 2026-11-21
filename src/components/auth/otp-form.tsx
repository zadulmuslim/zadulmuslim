"use client";
import { useActionState, useEffect, useState } from "react";
import { MailCheck } from "lucide-react";
import { resendLoginCode, verifyLoginCode } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage } from "@/components/ui/form-message";
import { toBnDigits } from "@/lib/utils";

export function OtpForm({ next, email, active, initialWait, ttl }: { next: string; email: string; active: boolean; justSent?: boolean; initialWait: number; ttl: number }) {
  const [state, verify] = useActionState(verifyLoginCode, null);
  const [resendState, resend] = useActionState(resendLoginCode, null);
  const [wait, setWait] = useState(initialWait);
  const hasCode = active || resendState?.ok;

  useEffect(() => {
    if (resendState?.ok) setWait(60);
  }, [resendState]);
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl bg-secondary/40 p-4 text-sm">
        <MailCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
        <p>
          {hasCode
            ? <>আপনার ইমেইলে (<strong dir="ltr">{email}</strong>) ৬ সংখ্যার একটি কোড পাঠানো হয়েছে। কোডটি {toBnDigits(ttl)} মিনিট কার্যকর।</>
            : <>অ্যাডমিন প্যানেলে ঢুকতে আপনার ইমেইলে (<strong dir="ltr">{email}</strong>) একটি কোড পাঠাতে হবে। নিচের বোতাম চাপুন।</>}
        </p>
      </div>

      {hasCode && (
        <form action={verify} className="space-y-4" noValidate>
          <input type="hidden" name="next" value={next} />
          <FormMessage state={state} />
          <div>
            <Label htmlFor="code">যাচাই কোড</Label>
            <Input
              id="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9০-৯]{6}"
              maxLength={6}
              autoFocus
              required
              placeholder="••••••"
              className="h-14 rounded-lg text-center font-mono text-2xl tracking-[0.5em]"
            />
          </div>
          <SubmitButton className="w-full" pendingText="যাচাই হচ্ছে…">যাচাই করে প্রবেশ করুন</SubmitButton>
        </form>
      )}

      <form action={resend} className="space-y-2 text-center">
        <FormMessage state={resendState} />
        {hasCode ? (
          <button type="submit" disabled={wait > 0} className="text-sm font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline">
            {wait > 0 ? `আবার কোড পাঠান (${toBnDigits(wait)} সেকেন্ড)` : "কোড পাননি? আবার কোড পাঠান"}
          </button>
        ) : (
          <SubmitButton className="w-full" pendingText="পাঠানো হচ্ছে…">ইমেইলে কোড পাঠান</SubmitButton>
        )}
        <p className="text-xs text-muted-foreground">স্প্যাম/প্রমোশন ফোল্ডারও দেখে নিন।</p>
      </form>
    </div>
  );
}
