import Link from "next/link";
import { BookMarked, ExternalLink, FileText, FilePlus2, HelpCircle, KeyRound, LogOut, Mail, MessageCircleQuestion, MessagesSquare, PlayCircle, UserRound } from "lucide-react";
import { siteConfig } from "@/config/site";
import { signOut } from "@/app/actions/auth";
import { HijriDate } from "@/components/layout/hijri-date";
import { toBnDigits } from "@/lib/utils";

interface Props {
  viewer: { name: string; roleLabel: string };
  pendingQuestions: number;
  reportedComments: number;
}

const CREATE = [
  { href: "/admin/questions/new", label: "নতুন প্রশ্নোত্তর", icon: MessageCircleQuestion },
  { href: "/admin/articles/new", label: "নতুন প্রবন্ধ", icon: FileText },
  { href: "/admin/lectures/new", label: "নতুন বয়ান", icon: PlayCircle },
  { href: "/admin/books/new", label: "নতুন বই", icon: BookMarked },
];

function Count({ n }: { n: number }) {
  if (!n) return null;
  return <span className="ml-auto rounded-full bg-accent px-1.5 py-px text-[11px] font-bold text-brand-deep">{toBnDigits(n)}</span>;
}

/** Admin panel footer: shortcuts, items needing attention, account and support. */
export function AdminFooter({ viewer, pendingQuestions, reportedComments }: Props) {
  const today = new Date().toLocaleDateString("bn-BD", { timeZone: "Asia/Dhaka", weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const link = "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition hover:bg-card hover:text-primary";

  return (
    <footer className="mt-16 overflow-hidden rounded-2xl border bg-secondary/40">
      <div className="grid gap-6 p-5 sm:grid-cols-2 lg:grid-cols-4 md:p-6">
        <div>
          <Link href="/admin" className="text-lg font-bold text-primary">{siteConfig.nameBn}</Link>
          <p className="text-xs text-muted-foreground">অ্যাডমিন প্যানেল</p>
          <div className="mt-4 flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm">
            <UserRound className="size-4 shrink-0 text-primary" aria-hidden />
            <span className="min-w-0">
              <span className="block truncate font-semibold">{viewer.name}</span>
              <span className="block text-xs text-muted-foreground">{viewer.roleLabel}</span>
            </span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {today}
            <br />
            <HijriDate />
          </p>
        </div>

        <div>
          <h2 className="mb-2 px-2 text-xs font-bold uppercase tracking-wide text-foreground">দ্রুত তৈরি করুন</h2>
          <ul>
            {CREATE.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link href={href} className={link}><Icon className="size-4" aria-hidden />{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-2 px-2 text-xs font-bold uppercase tracking-wide text-foreground">মনোযোগ প্রয়োজন</h2>
          <ul>
            <li>
              <Link href="/admin/questions?status=pending" className={link}>
                <HelpCircle className="size-4" aria-hidden />অপেক্ষমাণ প্রশ্ন<Count n={pendingQuestions} />
              </Link>
            </li>
            <li>
              <Link href="/admin/comments?f=reported" className={link}>
                <MessagesSquare className="size-4" aria-hidden />রিপোর্ট হওয়া মন্তব্য<Count n={reportedComments} />
              </Link>
            </li>
            <li>
              <Link href="/admin/media" className={link}><FilePlus2 className="size-4" aria-hidden />মিডিয়া লাইব্রেরি</Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 px-2 text-xs font-bold uppercase tracking-wide text-foreground">অ্যাকাউন্ট ও সহায়তা</h2>
          <ul>
            <li><Link href="/account" className={link}><UserRound className="size-4" aria-hidden />আমার অ্যাকাউন্ট</Link></li>
            <li><Link href="/account/password" className={link}><KeyRound className="size-4" aria-hidden />পাসওয়ার্ড পরিবর্তন</Link></li>
            <li><a href={`mailto:${siteConfig.contact.email}`} className={link}><Mail className="size-4" aria-hidden />সহায়তা: ইমেইল করুন</a></li>
            <li>
              <form action={signOut}>
                <button type="submit" className={`${link} w-full text-left hover:text-destructive`}><LogOut className="size-4" aria-hidden />লগআউট</button>
              </form>
            </li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t bg-card/60 px-5 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between md:px-6">
        <p>© {siteConfig.copyrightYear} {siteConfig.nameBn} · সর্বস্বত্ব সংরক্ষিত</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/" className="inline-flex items-center gap-1 hover:text-primary"><ExternalLink className="size-3.5" aria-hidden />সাইট দেখুন</Link>
          <Link href="/privacy" className="hover:text-primary">গোপনীয়তা</Link>
          <Link href="/terms" className="hover:text-primary">শর্তাবলি</Link>
        </div>
      </div>
    </footer>
  );
}
