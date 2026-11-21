"use client";
import { useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";

export function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";
  const enc = encodeURIComponent;
  const cls = "inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium hover:border-accent hover:text-primary";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">শেয়ার করুন:</span>
      <a className={cls} href={`https://wa.me/?text=${enc(`${title} ${url}`)}`} target="_blank" rel="noreferrer">WhatsApp</a>
      <a className={cls} href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`} target="_blank" rel="noreferrer">Facebook</a>
      <button
        type="button"
        className={cls}
        onClick={async () => {
          if (navigator.share) {
            await navigator.share({ title, url }).catch(() => undefined);
            return;
          }
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <Check className="size-3.5" /> : typeof navigator !== "undefined" && "share" in navigator ? <Share2 className="size-3.5" /> : <Link2 className="size-3.5" />}
        {copied ? "কপি হয়েছে" : "লিংক"}
      </button>
    </div>
  );
}
