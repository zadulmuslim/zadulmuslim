"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookMarked, FileText, History, Images, Inbox, LayoutDashboard, MessageCircleQuestion, MessagesSquare, PlayCircle, Tags, Users } from "lucide-react";
import { cn, toBnDigits } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "ড্যাশবোর্ড", icon: LayoutDashboard, exact: true },
  { href: "/admin/questions", label: "প্রশ্নোত্তর", icon: MessageCircleQuestion },
  { href: "/admin/articles", label: "প্রবন্ধ", icon: FileText },
  { href: "/admin/lectures", label: "বয়ান", icon: PlayCircle },
  { href: "/admin/books", label: "লাইব্রেরি", icon: BookMarked },
  { href: "/admin/comments", label: "মন্তব্য", icon: MessagesSquare },
  { href: "/admin/messages", label: "বার্তা", icon: Inbox },
  { href: "/admin/media", label: "মিডিয়া", icon: Images },
  { href: "/admin/categories", label: "বিষয়", icon: Tags },
  { href: "/admin/users", label: "ব্যবহারকারী", icon: Users, adminOnly: true },
  { href: "/admin/activity", label: "কার্যকলাপ", icon: History, adminOnly: true },
];

export function AdminNav({ isAdmin, pendingCount, newMessages = 0, vertical = false }: { isAdmin: boolean; pendingCount: number; newMessages?: number; vertical?: boolean }) {
  const pathname = usePathname();
  return (
    <ul className={cn("flex flex-col gap-1", vertical && "pb-4")}>
      {ITEMS.filter((i) => !i.adminOnly || isAdmin).map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <li key={href} className="shrink-0">
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active ? "bg-white/15 font-semibold text-white" : "text-white/80 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
              {href === "/admin/messages" && newMessages > 0 && (
                <span className="ml-auto rounded-full bg-accent px-2 text-xs font-bold text-brand-deep">{toBnDigits(newMessages)}</span>
              )}
              {href === "/admin/questions" && pendingCount > 0 && (
                <span className="ml-auto rounded-full bg-accent px-2 text-xs font-bold text-brand-deep">{toBnDigits(pendingCount)}</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
