"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, Trash2 } from "lucide-react";
import { useDialog } from "@/components/ui/dialogs";

export function MediaActions({ id, url }: { id: string; url: string }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();
  const dialog = useDialog();

  const absolute = url.startsWith("/") ? `${typeof window !== "undefined" ? window.location.origin : ""}${url}` : url;

  return (
    <div className="flex gap-1">
      <button
        type="button"
        className="grid size-8 place-items-center rounded-md hover:bg-secondary"
        aria-label="লিংক কপি করুন"
        onClick={async () => {
          await navigator.clipboard.writeText(absolute);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
      </button>
      <button
        type="button"
        className="grid size-8 place-items-center rounded-md text-destructive hover:bg-destructive/5"
        aria-label="মুছে ফেলুন"
        disabled={pending}
        onClick={async () => {
          const ok = await dialog.confirm({
            title: "ফাইলটি মুছে ফেলবেন?",
            message: "ফাইলটি স্থায়ীভাবে মুছে যাবে। যেসব প্রবন্ধ বা পোস্টে এটি ব্যবহৃত হয়েছে, সেখান থেকেও সরে যাবে।",
            tone: "danger",
          });
          if (!ok) return;
          start(async () => {
            const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
            if (!res.ok) {
              const message = (await res.json().catch(() => null))?.error?.message ?? "ফাইলটি মুছে ফেলা যায়নি। আবার চেষ্টা করুন।";
              await dialog.alert({ title: "মুছে ফেলা যায়নি", message, tone: "danger" });
            }
            router.refresh();
          });
        }}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
      </button>
    </div>
  );
}
