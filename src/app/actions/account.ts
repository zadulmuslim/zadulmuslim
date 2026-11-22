"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import type { FormState } from "@/components/ui/form-message";

const optional = (max: number, msg: string) =>
  z.string().trim().max(max, { message: msg }).transform((v) => v || null);

const profileSchema = z.object({
  display_name: z.string().trim().min(2, { message: "নাম কমপক্ষে ২ অক্ষরের হতে হবে।" }).max(80, { message: "নাম ৮০ অক্ষরের মধ্যে রাখুন।" }),
  bio: optional(300, "পরিচিতি ৩০০ অক্ষরের মধ্যে রাখুন।"),
  location: optional(80, "এলাকার নাম ৮০ অক্ষরের মধ্যে রাখুন।"),
  occupation: optional(80, "পেশা ৮০ অক্ষরের মধ্যে রাখুন।"),
  phone: optional(20, "মোবাইল নম্বরটি সঠিক নয়।").refine((v) => !v || /^[+০-৯0-9\s-]{6,20}$/.test(v), { message: "মোবাইল নম্বরটি সঠিক নয়।" }),
});

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "লগইন প্রয়োজন।" };
  const parsed = profileSchema.safeParse({
    display_name: formData.get("display_name") ?? "",
    bio: formData.get("bio") ?? "",
    location: formData.get("location") ?? "",
    occupation: formData.get("occupation") ?? "",
    phone: formData.get("phone") ?? "",
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", user.id);
  if (error) return { ok: false, message: "সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।" };
  revalidatePath("/account");
  return { ok: true, message: "প্রোফাইল সংরক্ষিত হয়েছে।" };
}
