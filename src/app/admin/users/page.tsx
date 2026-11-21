import type { Metadata } from "next";
import Link from "next/link";
import { Search, ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdmin } from "@/lib/env";
import { assignableRoles, canManageUser } from "@/lib/auth/permissions";
import { ROLE_LABEL_BN, type UserRole } from "@/lib/storage/categories";
import { PageHeader } from "@/components/admin/page-header";
import { UserRowActions } from "@/components/admin/user-row-actions";
import { FormMessage } from "@/components/ui/form-message";
import { formatBnDate } from "@/lib/format";
import { cn, toBnDigits } from "@/lib/utils";

export const metadata: Metadata = { title: "ব্যবহারকারী" };

const ROLE_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "সবাই" },
  { value: "staff", label: "টিম (সম্পাদক+)" },
  { value: "member", label: "সদস্য" },
];

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string; role?: string }> }) {
  const me = await requireAdmin("/admin/users");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase().slice(0, 100);
  const roleFilter = ROLE_FILTERS.some((r) => r.value === sp.role) ? sp.role! : "all";

  if (!hasSupabaseAdmin()) {
    return (
      <>
        <PageHeader title="ব্যবহারকারী ও ভূমিকা" />
        <FormMessage state={{ ok: false, message: "ব্যবহারকারীর তালিকা এই মুহূর্তে দেখানো যাচ্ছে না। সার্ভার কনফিগারেশন পরীক্ষা করুন।" }} />
      </>
    );
  }

  const admin = createAdminClient();
  // Small sites: load up to 1,000 accounts and filter here (Auth has no search API).
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const users = list?.users ?? [];
  const { data: profiles } = await admin.from("profiles").select("id, display_name, role").in("id", users.map((u) => u.id));
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  const rows = users
    .map((u) => ({ ...u, profile: byId.get(u.id), role: (byId.get(u.id)?.role ?? "member") as UserRole }))
    .filter((u) => !q || u.email?.toLowerCase().includes(q) || u.profile?.display_name?.toLowerCase().includes(q))
    .filter((u) => roleFilter === "all" || (roleFilter === "member" ? u.role === "member" : u.role !== "member"))
    .sort((a, b) => (a.role === b.role ? b.created_at.localeCompare(a.created_at) : ["super_admin", "admin", "editor", "member"].indexOf(a.role) - ["super_admin", "admin", "editor", "member"].indexOf(b.role)));

  const assignable = assignableRoles(me.role);

  return (
    <>
      <PageHeader
        title="ব্যবহারকারী ও ভূমিকা"
        description={`মোট ${toBnDigits(users.length)} জন · ${me.role === "super_admin" ? "আপনি সুপার অ্যাডমিন: অ্যাডমিন নিয়োগ ও অপসারণ করতে পারেন।" : "সম্পাদক নিয়োগ ও সদস্য মুছতে পারেন; অ্যাডমিন বানাতে পারেন কেবল সুপার অ্যাডমিন।"}`}
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {ROLE_FILTERS.map((r) => (
            <Link key={r.value} href={`/admin/users?role=${r.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={cn("rounded-full border px-3.5 py-1 text-sm", roleFilter === r.value ? "border-primary bg-primary text-white" : "bg-card hover:border-accent")}>
              {r.label}
            </Link>
          ))}
        </div>
        <form className="relative" action="/admin/users">
          <input type="hidden" name="role" value={roleFilter} />
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input name="q" defaultValue={q} placeholder="নাম বা ইমেইল…" className="h-9 w-60 rounded-full border bg-card pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </form>
      </div>

      <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-sm">
        {rows.map((u) => {
          const name = u.profile?.display_name ?? u.email ?? "—";
          const manageable = canManageUser(me, { id: u.id, role: u.role });
          return (
            <li key={u.id} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-medium">
                  {name}
                  {u.id === me.id && <span className="text-xs text-accent">(আপনি)</span>}
                  {u.role !== "member" && (
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", u.role === "super_admin" ? "bg-accent text-brand-deep" : "bg-primary/10 text-primary")}>
                      {u.role === "super_admin" && <ShieldCheck className="size-3" />}
                      {ROLE_LABEL_BN[u.role]}
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {u.email}
                  {!u.email_confirmed_at && " · ইমেইল যাচাই হয়নি"} · যোগদান {formatBnDate(u.created_at)}
                  {u.last_sign_in_at && ` · শেষ লগইন ${formatBnDate(u.last_sign_in_at)}`}
                </p>
              </div>
              <UserRowActions
                id={u.id}
                name={name}
                role={u.role}
                assignable={assignable.includes(u.role) ? assignable : [u.role, ...assignable]}
                manageable={manageable}
              />
            </li>
          );
        })}
        {rows.length === 0 && <li className="px-5 py-10 text-center text-sm text-muted-foreground">কাউকে পাওয়া যায়নি।</li>}
      </ul>
      <p className="mt-4 text-xs text-muted-foreground">
        নিরাপত্তার কারণে সুপার অ্যাডমিন নিয়োগ কেবল ডাটাবেস থেকে সরাসরি করা যায়।
      </p>
    </>
  );
}
