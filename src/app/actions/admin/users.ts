"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { actionUser } from "@/lib/auth/action-guard";
import type { FormState } from "@/components/ui/form-message";

export async function setUserRole(_prev: FormState, formData: FormData): Promise<FormState> {
  const auth = await actionUser("admin");
  if (!auth.user) return { ok: false, message: auth.error };
  const parsed = z.object({ id: z.uuid(), role: z.enum(["member", "editor", "admin"]) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "অনুরোধটি সঠিক নয়।" };
  if (parsed.data.id === auth.user.id && parsed.data.role !== "admin") {
    return { ok: false, message: "নিজের অ্যাডমিন ভূমিকা নিজে সরানো যায় না (অন্য একজন অ্যাডমিনকে বলুন)।" };
  }
  const { error } = await createAdminClient().from("profiles").update({ role: parsed.data.role }).eq("id", parsed.data.id);
  if (error) return { ok: false, message: "পরিবর্তন করা যায়নি।" };
  revalidatePath("/admin/users");
  return { ok: true, message: "ভূমিকা পরিবর্তন হয়েছে।" };
}
