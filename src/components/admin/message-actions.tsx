"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, Check, Mail, MailOpen, Trash2 } from "lucide-react";
import { useDialog } from "@/components/ui/dialogs";
import { updateContactMessage } from "@/app/actions/contact";

export function MessageActions({ id, status, email, subject }: { id: string; status: string; email: string; subject: string }) {
  const [pending, start] = useTransition();
  const dialog = useDialog();
  const router = useRouter();
  const run = (op: "read" | "replied" | "archived" | "new" | "delete") =>
    start(async () => {
      if (op === "delete" && !(await dialog.confirm({ title: "বার্তা মুছবেন?", message: "বার্তাটি স্থায়ীভাবে মুছে যাবে।", tone: "danger", confirmText: "মুছে ফেলুন" }))) return;
      const res = await updateContactMessage(id, op);
      if (res.error) await dialog.alert({ title: "সম্ভব হয়নি", message: res.error });
      router.refresh();
    });
  const btn = "inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1 text-xs font-medium hover:border-accent disabled:opacity-50";
  const reply = `mailto:${email}?subject=${encodeURIComponent(`Re: ${subject}`)}`;
  return (
    <div className="flex flex-wrap gap-1.5">
      <a href={reply} onClick={() => status !== "replied" && run("replied")} className={`${btn} border-primary/40 text-primary`}><Mail className="size-3.5" />উত্তর দিন</a>
      {status === "new" ? (
        <button disabled={pending} onClick={() => run("read")} className={btn}><MailOpen className="size-3.5" />পড়া হয়েছে</button>
      ) : (
        <button disabled={pending} onClick={() => run("new")} className={btn}>অপঠিত করুন</button>
      )}
      {status !== "replied" && <button disabled={pending} onClick={() => run("replied")} className={btn}><Check className="size-3.5" />উত্তর দেওয়া হয়েছে</button>}
      {status !== "archived" && <button disabled={pending} onClick={() => run("archived")} className={btn}><Archive className="size-3.5" />আর্কাইভ</button>}
      <button disabled={pending} onClick={() => run("delete")} className={`${btn} text-destructive`}><Trash2 className="size-3.5" />মুছুন</button>
    </div>
  );
}
