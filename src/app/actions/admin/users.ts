"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { actionUser } from "@/lib/auth/action-guard";
import { canAssign, canManageUser } from "@/lib/auth/permissions";
import { logActivity } from "@/lib/audit";
import { ROLE_LABEL_BN, type UserRole } from "@/lib/storage/categories";
import type { FormState } from "@/components/ui/form-message";

async function targetOf(id: string) {
  const { data } = await createAdminClient().from("profiles").select("id, role, display_name").eq("id", id).maybeSingle();
  return data;
}

export async function setUserRole(_prev: FormState, formData: FormData): Promise<FormState> {
  const auth = await actionUser("admin");
  if (!auth.user) return { ok: false, message: auth.error };
  const parsed = z.object({ id: z.uuid(), role: z.enum(["member", "editor", "admin"]) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "অনুরোধটি সঠিক নয়।" };

  const target = await targetOf(parsed.data.id);
  if (!target) return { ok: false, message: "ব্যবহারকারী পাওয়া যায়নি।" };
  if (!canAssign(auth.user, target, parsed.data.role)) {
    return { ok: false, message: parsed.data.role === "admin" || target.role === "admin" ? "অ্যাডমিন বানানো বা সরানো কেবল সুপার অ্যাডমিন পারেন।" : "এই পরিবর্তনের অনুমতি নেই।" };
  }

  // The user's own session: the database trigger enforces the same rules.
  const { error } = await (await createClient()).from("profiles").update({ role: parsed.data.role }).eq("id", parsed.data.id);
  if (error) return { ok: false, message: "পরিবর্তন করা যায়নি।" };

  await logActivity(auth.user, {
    action: "user.role",
    entity: "user",
    entityId: target.id,
    summary: `${target.display_name ?? "ব্যবহারকারী"}: ${ROLE_LABEL_BN[target.role as UserRole]} → ${ROLE_LABEL_BN[parsed.data.role]}`,
  });
  revalidatePath("/admin/users");
  return { ok: true, message: "ভূমিকা পরিবর্তন হয়েছে।" };
}

export async function deleteUser(_prev: FormState, formData: FormData): Promise<FormState> {
  const auth = await actionUser("admin");
  if (!auth.user) return { ok: false, message: auth.error };
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { ok: false, message: "অনুরোধটি সঠিক নয়।" };

  const target = await targetOf(id.data);
  if (!target) return { ok: false, message: "ব্যবহারকারী পাওয়া যায়নি।" };
  if (!canManageUser(auth.user, target)) {
    return { ok: false, message: target.role === "admin" ? "অ্যাডমিনকে কেবল সুপার অ্যাডমিন মুছতে পারেন।" : "এই ব্যবহারকারীকে মোছার অনুমতি নেই।" };
  }

  const admin = createAdminClient();
  const { data: authUser } = await admin.auth.admin.getUserById(target.id);
  const { error } = await admin.auth.admin.deleteUser(target.id);
  if (error) return { ok: false, message: "মুছে ফেলা যায়নি।" };

  await logActivity(auth.user, {
    action: "user.delete",
    entity: "user",
    entityId: target.id,
    summary: `${target.display_name ?? ""} (${authUser?.user?.email ?? "ইমেইল অজানা"}) মুছে ফেলা হয়েছে`,
  });
  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { ok: true, message: "ব্যবহারকারী মুছে ফেলা হয়েছে।" };
}
