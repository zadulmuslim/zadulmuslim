"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import type { FormState } from "@/components/ui/form-message";

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "লগইন প্রয়োজন।" };
  const parsed = z.string().trim().min(2, { message: "নাম কমপক্ষে ২ অক্ষরের হতে হবে।" }).max(80).safeParse(formData.get("display_name"));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ display_name: parsed.data }).eq("id", user.id);
  if (error) return { ok: false, message: "সংরক্ষণ করা যায়নি।" };
  revalidatePath("/account");
  return { ok: true, message: "প্রোফাইল সংরক্ষিত হয়েছে।" };
}
