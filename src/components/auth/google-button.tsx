"use client";
import { useFormStatus } from "react-dom";
import { signInWithGoogle } from "@/app/actions/auth";

function Inner({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-11 w-full items-center justify-center gap-3 rounded-full border bg-white px-4 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary/40 hover:bg-muted/40 disabled:opacity-60"
    >
      {pending ? (
        <span className="size-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" aria-hidden />
      ) : (
        <span className="grid size-6 place-items-center rounded-full border text-[13px] font-bold text-primary" aria-hidden>G</span>
      )}
      {pending ? "Google-এ নেওয়া হচ্ছে…" : label}
    </button>
  );
}

/** "Continue with Google" plus an "অথবা" divider before the email form. */
export function GoogleSignIn({ next, label = "Google দিয়ে চালিয়ে যান" }: { next?: string; label?: string }) {
  return (
    <div className="mb-5">
      <form action={signInWithGoogle}>
        {next && <input type="hidden" name="next" value={next} />}
        <Inner label={label} />
      </form>
      <div className="mt-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        অথবা ইমেইল দিয়ে
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
