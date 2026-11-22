"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCw, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CaptchaChallenge } from "@/lib/captcha-types";

type Ready = Extract<CaptchaChallenge, { enabled: true }> & { at: number };
const MAX_AGE = 8 * 60_000; // tokens expire after 10 minutes on the server

async function fetchChallenge(): Promise<CaptchaChallenge> {
  const res = await fetch("/api/captcha", { cache: "no-store" });
  if (!res.ok) throw new Error("captcha");
  return res.json();
}

/**
 * Zadulmuslim's security check: a small sum drawn as an image.
 * The first challenge comes rendered with the page (`initial`), and a spare
 * one is fetched in the background, so a new question appears instantly on
 * reload or after a failed attempt. Pass the form's last result as `resetKey`.
 */
export function Captcha({ initial, resetKey, error }: { initial?: CaptchaChallenge; resetKey?: unknown; error?: string }) {
  const [challenge, setChallenge] = useState<Ready | null>(initial?.enabled ? { ...initial, at: Date.now() } : null);
  const [disabled, setDisabled] = useState(initial ? !initial.enabled : false);
  const [failed, setFailed] = useState(false);
  const [answer, setAnswer] = useState("");
  const [spin, setSpin] = useState(0);
  const spare = useRef<Ready | null>(null);
  const filling = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fillSpare = useCallback(async () => {
    if (filling.current) return;
    filling.current = true;
    try {
      const c = await fetchChallenge();
      if (c.enabled) spare.current = { ...c, at: Date.now() };
    } catch {
      /* the next reload will fetch directly */
    } finally {
      filling.current = false;
    }
  }, []);

  /** Shows a new question: the spare one at once if fresh, otherwise fetches. */
  const next = useCallback(async () => {
    setAnswer("");
    setFailed(false);
    const s = spare.current;
    spare.current = null;
    if (s && Date.now() - s.at < MAX_AGE) {
      setChallenge(s);
      void fillSpare();
      return;
    }
    try {
      const c = await fetchChallenge();
      if (!c.enabled) return setDisabled(true);
      setChallenge({ ...c, at: Date.now() });
      void fillSpare();
    } catch {
      setFailed(true);
    }
  }, [fillSpare]);

  // First load: use the server-rendered challenge, then prepare a spare.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      if (initial) {
        if (initial.enabled) void fillSpare();
        return;
      }
    }
    void next();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const reload = () => {
    setSpin((n) => n + 1);
    void next();
    inputRef.current?.focus();
  };

  if (disabled) return null;
  return (
    <div>
      <label htmlFor="captcha_answer" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
        <ShieldCheck className="size-4 text-primary" aria-hidden /> নিরাপত্তা যাচাই
        <span className="font-normal text-muted-foreground">— অঙ্কটির ফল লিখুন</span>
      </label>
      <div
        className={cn(
          "flex h-14 items-stretch overflow-hidden rounded-xl border bg-card transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
          error && "border-destructive/60",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center justify-center bg-[#fbf8ef]">
          {challenge ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={challenge.token}
              src={challenge.image}
              alt="নিরাপত্তা প্রশ্ন: ছবিতে লেখা অঙ্কটির ফলাফল"
              width={220}
              height={64}
              draggable={false}
              className="h-full w-full select-none object-contain"
            />
          ) : failed ? (
            <span className="text-xs text-muted-foreground">লোড হয়নি — ডানের বোতামে চাপুন</span>
          ) : (
            <span className="h-3 w-24 animate-pulse rounded bg-muted" aria-label="লোড হচ্ছে" />
          )}
        </div>
        <input
          ref={inputRef}
          id="captcha_answer"
          name="captcha_answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          required
          placeholder="উত্তর"
          aria-invalid={Boolean(error)}
          className="w-20 shrink-0 border-x bg-transparent px-2 text-center text-lg font-semibold tracking-wide placeholder:text-sm placeholder:font-normal placeholder:text-muted-foreground focus:outline-none sm:w-24"
        />
        <button
          type="button"
          onClick={reload}
          aria-label="নতুন প্রশ্ন"
          title="নতুন প্রশ্ন"
          className="flex w-12 shrink-0 items-center justify-center text-primary transition hover:bg-muted active:bg-muted"
        >
          <RotateCw key={spin} className={cn("size-5", spin > 0 && "animate-[spin_600ms_ease-in-out_1]")} aria-hidden />
        </button>
      </div>
      <input type="hidden" name="captcha_token" value={challenge?.token ?? ""} />
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}
