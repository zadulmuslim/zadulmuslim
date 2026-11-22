import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, CalendarClock, Clock3, Compass, HandCoins, KeyRound, LayoutDashboard, LogOut, Mail, MessageCircleQuestion, MessagesSquare, ShieldCheck, ThumbsUp, CheckCircle2 } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { roleAtLeast, ROLE_LABEL_BN as ROLE_LABEL } from "@/lib/storage/categories";
import { signOut } from "@/app/actions/auth";
import { getMyActivity } from "@/lib/account";
import { ProfileCard } from "@/components/account/profile-card";
import { ActivityTabs } from "@/components/account/activity-tabs";
import { FormMessage } from "@/components/ui/form-message";
import { cn, toBnDigits } from "@/lib/utils";

export const metadata: Metadata = { title: "আমার অ্যাকাউন্ট", robots: { index: false } };

const fmt = (iso: string | null | undefined, withTime = false) =>
  iso
    ? new Date(iso).toLocaleString("bn-BD", { timeZone: "Asia/Dhaka", day: "numeric", month: "long", year: "numeric", ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}) })
    : "—";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ denied?: string; password?: string; welcome?: string }> }) {
  const user = await requireUser("/account");
  const { denied, password, welcome } = await searchParams;
  const supabase = await createClient();

  const [{ data: profile }, { data: auth }, { data: questions }, activity] = await Promise.all([
    supabase.from("profiles").select("display_name, bio, location, occupation, phone, created_at, avatar:avatar_media_id(public_url)").eq("id", user.id).maybeSingle(),
    supabase.auth.getUser(),
    supabase.from("questions").select("id, title, status, slug, is_public, created_at").eq("asker_id", user.id).order("created_at", { ascending: false }).limit(50),
    getMyActivity(user.id),
  ]);
  const prof = profile as (typeof profile & { avatar: { public_url: string | null } | null }) | null;
  const name = prof?.display_name?.trim() || user.displayName || user.email?.split("@")[0] || "সদস্য";
  const isStaff = roleAtLeast(user.role, "editor");
  const qs = questions ?? [];
  const answered = qs.filter((q) => q.status === "answered").length;

  // Profile completeness.
  const checks = [
    { label: "নাম", done: Boolean(prof?.display_name?.trim()) },
    { label: "প্রোফাইল ছবি", done: Boolean(prof?.avatar?.public_url) },
    { label: "পরিচিতি", done: Boolean(prof?.bio) },
    { label: "পেশা", done: Boolean(prof?.occupation) },
    { label: "জেলা / এলাকা", done: Boolean(prof?.location) },
  ];
  const pct = Math.round((checks.filter((c) => c.done).length / checks.length) * 100);

  const stats = [
    { label: "প্রশ্ন করেছেন", value: qs.length, icon: MessageCircleQuestion },
    { label: "উত্তর পেয়েছেন", value: answered, icon: CheckCircle2 },
    { label: "মন্তব্য", value: activity.commentCount, icon: MessagesSquare },
    { label: "প্রতিক্রিয়া", value: activity.reactionCount, icon: ThumbsUp },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      {welcome && <FormMessage state={{ ok: true, message: "আসসালামু আলাইকুম! আপনার ইমেইল যাচাই হয়েছে, যাদুল মুসলিমে স্বাগতম।" }} className="mb-4" />}
      {denied && <FormMessage state={{ ok: false, message: "এই পেজে প্রবেশের অনুমতি আপনার নেই।" }} className="mb-4" />}
      {password && <FormMessage state={{ ok: true, message: "আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে।" }} className="mb-4" />}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <ProfileCard
            p={{
              name,
              email: user.email,
              bio: prof?.bio ?? null,
              location: prof?.location ?? null,
              occupation: prof?.occupation ?? null,
              phone: prof?.phone ?? null,
              avatarUrl: prof?.avatar?.public_url ?? null,
              roleLabel: ROLE_LABEL[user.role],
              isStaff,
              emailVerified: Boolean(auth.user?.email_confirmed_at),
              joined: prof?.created_at ?? auth.user?.created_at ?? new Date().toISOString(),
            }}
          />

          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map(({ label, value, icon: Icon }) => (
              <li key={label} className="rounded-2xl border bg-card p-4 shadow-sm">
                <Icon className="size-5 text-accent" aria-hidden />
                <p className="mt-2 text-2xl font-bold tabular-nums text-primary">{toBnDigits(value)}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </li>
            ))}
          </ul>

          <ActivityTabs
            questions={qs.map((q) => ({ id: q.id, title: q.title, status: q.status, slug: q.slug, isPublic: q.is_public, createdAt: q.created_at }))}
            comments={activity.comments}
          />
        </div>

        <aside className="space-y-6">
          {isStaff && (
            <Link href="/admin" className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-brand-deep to-primary p-4 text-white shadow-sm transition hover:shadow-md">
              <span className="grid size-10 place-items-center rounded-xl bg-white/15"><LayoutDashboard className="size-5 text-accent" /></span>
              <span><span className="block font-semibold">অ্যাডমিন প্যানেল</span><span className="block text-xs text-white/75">প্রশ্নোত্তর, প্রবন্ধ ও কনটেন্ট পরিচালনা</span></span>
            </Link>
          )}

          {pct < 100 && (
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">প্রোফাইল সম্পূর্ণতা</h2>
                <span className="text-sm font-bold text-primary">{toBnDigits(pct)}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${pct}%` }} /></div>
              <ul className="mt-3 space-y-1.5 text-sm">
                {checks.map((c) => (
                  <li key={c.label} className={cn("flex items-center gap-2", c.done ? "text-muted-foreground line-through" : "text-foreground")}>
                    <CheckCircle2 className={cn("size-4", c.done ? "text-primary" : "text-muted-foreground/40")} aria-hidden />{c.label}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="mb-3 font-bold">অ্যাকাউন্টের তথ্য</h2>
            <dl className="space-y-3 text-sm">
              <Row icon={Mail} label="ইমেইল" value={<span className="break-all">{user.email}</span>} />
              <Row icon={ShieldCheck} label="ভূমিকা" value={ROLE_LABEL[user.role]} />
              <Row icon={CalendarClock} label="অ্যাকাউন্ট খোলা" value={fmt(prof?.created_at ?? auth.user?.created_at)} />
              <Row icon={Clock3} label="সর্বশেষ লগইন" value={fmt(auth.user?.last_sign_in_at, true)} />
            </dl>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="mb-1 font-bold">নিরাপত্তা</h2>
            {isStaff && <p className="mb-2 flex items-center gap-1.5 text-xs text-primary"><ShieldCheck className="size-3.5" />স্টাফ অ্যাকাউন্ট: লগইনে ইমেইল কোড যাচাই চালু আছে</p>}
            <div className="mt-2 space-y-1">
              <Link href="/account/password" className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted"><KeyRound className="size-4 text-primary" />পাসওয়ার্ড পরিবর্তন করুন</Link>
              <form action={signOut}>
                <button type="submit" className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-destructive hover:bg-destructive/5"><LogOut className="size-4" />লগআউট</button>
              </form>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="mb-2 font-bold">দ্রুত যান</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                { href: "/ask", label: "প্রশ্ন করুন", icon: MessageCircleQuestion },
                { href: "/quran", label: "আল-কুরআন", icon: BookOpen },
                { href: "/prayer-times", label: "নামাজের সময়", icon: Compass },
                { href: "/zakat", label: "যাকাত হিসাব", icon: HandCoins },
              ].map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className="flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition hover:border-accent hover:bg-muted/50">
                  <Icon className="size-5 text-primary" aria-hidden />{label}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="font-medium">{value}</dd>
      </div>
    </div>
  );
}
