import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdmin } from "@/lib/env";
import { FormMessage } from "@/components/ui/form-message";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { RoleForm } from "@/components/admin/role-form";
import { formatBnDate } from "@/lib/format";

export const metadata: Metadata = { title: "ব্যবহারকারী" };
const PER_PAGE = 50;

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const me = await requireAdmin("/admin/users");
  const page = Math.max(1, Number((await searchParams).page) || 1);
  if (!hasSupabaseAdmin()) {
    return (
      <>
        <PageHeader title="ব্যবহারকারী ও ভূমিকা" />
        <FormMessage state={{ ok: false, message: "এই সাইটে Supabase-এর গোপন key (SUPABASE_SECRET_KEY) সেট করা নেই, তাই ব্যবহারকারীর তালিকা দেখানো যাচ্ছে না।" }} />
      </>
    );
  }

  const admin = createAdminClient();
  const { data: list } = await admin.auth.admin.listUsers({ page, perPage: PER_PAGE });
  const users = list?.users ?? [];
  const { data: profiles } = await admin.from("profiles").select("id, display_name, role").in("id", users.map((u) => u.id));
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  const total = (list as { total?: number } | null)?.total ?? users.length;

  return (
    <>
      <PageHeader title="ব্যবহারকারী ও ভূমিকা" description="সম্পাদকরা কনটেন্ট ও প্রশ্নোত্তর পরিচালনা করতে পারেন; অ্যাডমিনরা ভূমিকাও বদলাতে পারেন।" />
      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left text-xs text-muted-foreground">
            <tr><th className="px-4 py-2.5 font-medium">নাম ও ইমেইল</th><th className="px-4 py-2.5 font-medium">যোগদান</th><th className="px-4 py-2.5 font-medium">ভূমিকা</th></tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => {
              const p = byId.get(u.id);
              return (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{p?.display_name ?? "—"}{u.id === me.id && <span className="ml-1 text-xs text-accent">(আপনি)</span>}</p>
                    <p className="text-xs text-muted-foreground">{u.email}{!u.email_confirmed_at && " · ইমেইল যাচাই হয়নি"}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{formatBnDate(u.created_at)}</td>
                  <td className="px-4 py-3"><RoleForm id={u.id} role={p?.role ?? "member"} isSelf={u.id === me.id} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageCount={Math.ceil(total / PER_PAGE)} makeHref={(p) => `/admin/users?page=${p}`} />
    </>
  );
}
