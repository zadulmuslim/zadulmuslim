"use client";
import { useState } from "react";
import Link from "next/link";
import { MessageCircleQuestion, MessagesSquare, PenLine } from "lucide-react";
import { StatusBadge } from "@/components/admin/status-badge";
import { cn, toBnDigits } from "@/lib/utils";

export interface MyQuestion { id: string; title: string; status: string; slug: string | null; isPublic: boolean; createdAt: string }
export interface MyCommentItem { id: string; body: string; createdAt: string; hidden: boolean; isReply: boolean; post: { href: string; title: string; type: string } | null }

const date = (iso: string) => new Date(iso).toLocaleDateString("bn-BD", { timeZone: "Asia/Dhaka", day: "numeric", month: "short", year: "numeric" });
const Q_FILTERS = [
  { key: "all", label: "সব" },
  { key: "answered", label: "উত্তর হয়েছে" },
  { key: "open", label: "অপেক্ষমাণ" },
] as const;

export function ActivityTabs({ questions, comments }: { questions: MyQuestion[]; comments: MyCommentItem[] }) {
  const [tab, setTab] = useState<"questions" | "comments">("questions");
  const [qf, setQf] = useState<(typeof Q_FILTERS)[number]["key"]>("all");
  const shownQ = questions.filter((q) => qf === "all" || (qf === "answered" ? q.status === "answered" : q.status !== "answered" && q.status !== "rejected"));

  const tabBtn = (key: typeof tab, label: string, n: number, Icon: typeof MessagesSquare) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === key}
      onClick={() => setTab(key)}
      className={cn("flex flex-1 items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition sm:flex-none sm:px-5", tab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
    >
      <Icon className="size-4" aria-hidden />{label}
      <span className="rounded-full bg-muted px-1.5 text-xs">{toBnDigits(n)}</span>
    </button>
  );

  return (
    <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
      <div role="tablist" className="flex border-b px-2">
        {tabBtn("questions", "আমার প্রশ্ন", questions.length, MessageCircleQuestion)}
        {tabBtn("comments", "আমার মন্তব্য", comments.length, MessagesSquare)}
      </div>

      {tab === "questions" ? (
        <div className="p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1.5">
              {Q_FILTERS.map((f) => (
                <button key={f.key} type="button" onClick={() => setQf(f.key)} className={cn("rounded-full border px-3 py-1 text-xs font-medium", qf === f.key ? "border-primary bg-primary text-white" : "hover:border-accent")}>{f.label}</button>
              ))}
            </div>
            <Link href="/ask" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"><PenLine className="size-4" />নতুন প্রশ্ন</Link>
          </div>
          {shownQ.length ? (
            <ul className="divide-y">
              {shownQ.map((q) => (
                <li key={q.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    {q.status === "answered" && q.isPublic && q.slug ? (
                      <Link href={`/qa/${q.slug}`} className="line-clamp-2 font-medium hover:text-primary">{q.title}</Link>
                    ) : (
                      <p className="line-clamp-2 font-medium">{q.title}</p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">{date(q.createdAt)}</p>
                  </div>
                  <StatusBadge status={q.status} />
                </li>
              ))}
            </ul>
          ) : (
            <Empty text={questions.length ? "এই তালিকায় কোনো প্রশ্ন নেই।" : "এখনো কোনো প্রশ্ন করেননি। শরঈ কোনো বিষয়ে জানতে চাইলে আলেমদের কাছে প্রশ্ন করুন।"} href="/ask" cta="প্রশ্ন করুন" />
          )}
        </div>
      ) : (
        <div className="p-4 sm:p-5">
          {comments.length ? (
            <ul className="divide-y">
              {comments.map((c) => (
                <li key={c.id} className="py-3">
                  <p className="text-xs text-muted-foreground">
                    {c.isReply ? "উত্তর দিয়েছেন" : "মন্তব্য করেছেন"}
                    {c.post && <> · {c.post.type}: <Link href={`${c.post.href}#comments`} className="font-medium text-primary hover:underline">{c.post.title}</Link></>}
                    {" · "}{date(c.createdAt)}
                    {c.hidden && <span className="ml-1.5 rounded bg-amber-100 px-1.5 text-amber-800">লুকানো</span>}
                  </p>
                  <p className="mt-1 line-clamp-3 whitespace-pre-line rounded-2xl bg-muted px-3.5 py-2 text-sm">{c.body}</p>
                </li>
              ))}
            </ul>
          ) : (
            <Empty text="এখনো কোনো মন্তব্য করেননি। প্রশ্নোত্তর, প্রবন্ধ বা হাদীসের নিচে আলোচনায় অংশ নিন।" href="/qa" cta="প্রশ্নোত্তর দেখুন" />
          )}
        </div>
      )}
    </div>
  );
}

function Empty({ text, href, cta }: { text: string; href: string; cta: string }) {
  return (
    <div className="py-10 text-center">
      <p className="mx-auto max-w-sm text-sm text-muted-foreground">{text}</p>
      <Link href={href} className="mt-3 inline-flex rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-deep">{cta}</Link>
    </div>
  );
}
