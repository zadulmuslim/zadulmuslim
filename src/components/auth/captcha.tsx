"use client";
import { useCallback, useEffect, useState } from "react";
import { RotateCw, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Challenge = { enabled: false } | { enabled: true; token: string; image: string };

/**
 * Zadulmuslim's security check: a small sum drawn as an image.
 * Pass the form's last result as `resetKey` — every submission uses the
 * challenge up, so a new one is loaded after each attempt.
 */
export function Captcha({ resetKey, error }: { resetKey?: unknown; error?: string }) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [failed, setFailed] = useState(false);
  const [answer, setAnswer] = useState("");

  const load = useCallback(async () => {
    setFailed(false);
    setAnswer("");
    try {
      const res = await fetch("/api/captcha", { cache: "no-store" });
      setChallenge(await res.json());
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, resetKey]);

  if (challenge && !challenge.enabled) return null;
  return (
    <div className={cn("rounded-xl border bg-secondary/30 p-3", error && "border-destructive/50")}>
      <Label htmlFor="captcha_answer" className="flex items-center gap-1.5">
        <ShieldCheck className="size-4 text-primary" aria-hidden /> নিরাপত্তা যাচাই
      </Label>
      <p className="mb-2 text-xs text-muted-foreground">ছবির অঙ্কটির ফলাফল লিখুন।</p>
      <div className="flex items-center gap-2">
        <div className="flex h-12 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-lg border bg-[#fbf8ef]">
          {challenge?.enabled ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={challenge.image} alt="নিরাপত্তা প্রশ্ন: ছবিতে লেখা অঙ্কটির ফলাফল" width={220} height={64} draggable={false} className="h-full w-full select-none object-contain" />
          ) : (
            <span className="text-xs text-muted-foreground">{failed ? "লোড হয়নি" : "লোড হচ্ছে…"}</span>
          )}
        </div>
        <button type="button" onClick={load} aria-label="নতুন প্রশ্ন" title="নতুন প্রশ্ন" className="flex size-10 shrink-0 items-center justify-center rounded-full border bg-card text-primary hover:border-accent">
          <RotateCw className="size-4" aria-hidden />
        </button>
        <Input
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
          className="h-12 w-[4.75rem] shrink-0 rounded-lg px-2 text-center text-base"
        />
      </div>
      <input type="hidden" name="captcha_token" value={challenge?.enabled ? challenge.token : ""} />
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}
