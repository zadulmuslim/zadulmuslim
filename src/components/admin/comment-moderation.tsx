"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useDialog } from "@/components/ui/dialogs";
import { moderateComment } from "@/app/admin/comments/actions";

export function CommentModeration({ id, hidden, reported }: { id: string; hidden: boolean; reported: boolean }) {
  const [pending, start] = useTransition();
  const dialog = useDialog();
  const router = useRouter();
  const run = (op: "hide" | "show" | "delete" | "dismiss") =>
    start(async () => {
      if (op === "delete" && !(await dialog.confirm({ title: "মন্তব্য মুছবেন?", message: "মন্তব্য ও এর সব উত্তর স্থায়ীভাবে মুছে যাবে।", tone: "danger", confirmText: "মুছে ফেলুন" }))) return;
      const res = await moderateComment(id, op);
      if (res.error) await dialog.alert({ title: "সম্ভব হয়নি", message: res.error });
      router.refresh();
    });
  const btn = "rounded-full border bg-card px-3 py-1 text-xs font-medium hover:border-accent disabled:opacity-50";
  return (
    <div className="flex flex-wrap gap-1.5">
      {hidden ? (
        <button disabled={pending} onClick={() => run("show")} className={btn}>আবার দেখান</button>
      ) : (
        <button disabled={pending} onClick={() => run("hide")} className={btn}>লুকিয়ে রাখুন</button>
      )}
      {reported && !hidden && <button disabled={pending} onClick={() => run("dismiss")} className={btn}>রিপোর্ট খারিজ</button>}
      <button disabled={pending} onClick={() => run("delete")} className={`${btn} text-destructive`}>মুছে ফেলুন</button>
    </div>
  );
}
