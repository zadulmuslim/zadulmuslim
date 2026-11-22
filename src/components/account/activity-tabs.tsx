"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock3, CornerDownRight, MessageCircle, MessageCircleQuestion, MessagesSquare, PenLine } from "lucide-react";
import { StatusBadge } from "@/components/admin/status-badge";
import { cn, toBnDigits } from "@/lib/utils";

export interface MyQuestion {
  id: string; title: string; status: string; slug: string | null; isPublic: boolean;
  createdAt: string; publishedAt: string | null; comments: number;
}
export interface MyCommentItem {
  id: string; body: string; createdAt: string; editedAt: string | null; hidden: boolean; isReply: boolean; replyCount: number;
  post: { href: string; title: string; type: string } | null;
}

const date = (iso: string) => new Date(iso).toLocaleDateString("bn-BD", { timeZone: "Asia/Dhaka", day: "numeric", month: "short", year: "numeric" });
const dateTime = (iso: string) => new Date(iso).toLocaleString("bn-BD", { timeZone: "Asia/Dhaka", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" });

function ago(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "এইমাত্র";
  const m = s / 60, h = m / 60, d = h / 24;
  if (m < 60) return `${toBnDigits(Math.floor(m))} মিনিট আগে`;
  if (h < 24) return `${toBnDigits(Math.floor(h))} ঘণ্টা আগে`;
  if (d < 30) return `${toBnDigits(Math.floor(d))} দিন আগে`;
  return date(iso);
}

const Q_FILTERS = [
  { key: "all", label: "সব" },
  { key: "answered", label: "প্রকাশিত" },
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
            <ul className="space-y-3">
              {shownQ.map((q) => {
                const href = q.status === "answered" && q.isPublic && q.slug ? `/qa/${q.slug}` : null;
                const body = (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <p className={cn("line-clamp-2 font-semibold", href && "group-hover:text-primary")}>{q.title}</p>
                      <StatusBadge status={q.status} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1" title={dateTime(q.createdAt)}><Clock3 className="size-3.5" />জিজ্ঞেস করেছেন {ago(q.createdAt)}</span>
                      {q.publishedAt && <span>প্রকাশিত: {date(q.publishedAt)}</span>}
                      {href && <span className="inline-flex items-center gap-1"><MessageCircle className="size-3.5" />{toBnDigits(q.comments)}টি মন্তব্য</span>}
                      {href ? (
                        <span className="ml-auto inline-flex items-center gap-1 font-semibold text-primary">উত্তর পড়ুন <ArrowRight className="size-3.5" /></span>
                      ) : q.status === "rejected" ? (
                        <span className="ml-auto">প্রকাশের জন্য বিবেচিত হয়নি</span>
                      ) : q.status === "answered" ? (
                        <span className="ml-auto">উত্তর দেওয়া হয়েছে (প্রকাশ্য নয়)</span>
                      ) : (
                        <span className="ml-auto">আলেমগণের পর্যালোচনার অপেক্ষায়</span>
                      )}
                    </div>
                  </>
                );
                return (
                  <li key={q.id}>
                    {href ? (
                      <Link href={href} className="group block rounded-2xl border p-3.5 transition hover:border-accent hover:bg-muted/40">{body}</Link>
                    ) : (
                      <div className="rounded-2xl border border-dashed p-3.5">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty text={questions.length ? "এই তালিকায় কোনো প্রশ্ন নেই।" : "এখনো কোনো প্রশ্ন করেননি। শরঈ কোনো বিষয়ে জানতে চাইলে আলেমদের কাছে প্রশ্ন করুন।"} href="/ask" cta="প্রশ্ন করুন" />
          )}
        </div>
      ) : (
        <div className="p-4 sm:p-5">
          {comments.length ? (
            <ul className="space-y-3">
              {comments.map((c) => {
                const href = c.post ? `${c.post.href}#comment-${c.id}` : null;
                const body = (
                  <>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {c.isReply && <CornerDownRight className="size-3.5" aria-hidden />}
                      {c.isReply ? "একটি মন্তব্যের উত্তর দিয়েছেন" : "মন্তব্য করেছেন"}
                      {c.post && <span className="rounded bg-primary/10 px-1.5 py-px font-medium text-primary">{c.post.type}</span>}
                      {c.hidden && <span className="rounded bg-amber-100 px-1.5 py-px text-amber-800">লুকানো</span>}
                    </p>
                    <p className={cn("mt-1 line-clamp-2 font-semibold", href && "group-hover:text-primary")}>
                      {c.post?.title ?? "পোস্টটি আর পাওয়া যাচ্ছে না"}
                    </p>
                    <p className="mt-2 line-clamp-3 whitespace-pre-line rounded-2xl bg-muted px-3.5 py-2 text-sm">{c.body}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1" title={dateTime(c.createdAt)}><Clock3 className="size-3.5" />{ago(c.createdAt)}</span>
                      {!c.isReply && <span className="inline-flex items-center gap-1"><MessageCircle className="size-3.5" />{c.replyCount ? `${toBnDigits(c.replyCount)}টি উত্তর` : "এখনো উত্তর নেই"}</span>}
                      {c.editedAt && <span>সম্পাদিত</span>}
                      {href && <span className="ml-auto inline-flex items-center gap-1 font-semibold text-primary">পোস্টে দেখুন <ArrowRight className="size-3.5" /></span>}
                    </div>
                  </>
                );
                return (
                  <li key={c.id}>
                    {href ? (
                      <Link href={href} className="group block rounded-2xl border p-3.5 transition hover:border-accent hover:bg-muted/40">{body}</Link>
                    ) : (
                      <div className="rounded-2xl border border-dashed p-3.5 opacity-75">{body}</div>
                    )}
                  </li>
                );
              })}
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
