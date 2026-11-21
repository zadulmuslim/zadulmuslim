"use server";
import { headers } from "next/headers";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdmin } from "@/lib/env";
import { getSessionUser } from "@/lib/auth/session";
import type { FormState } from "@/components/ui/form-message";

const schema = z.object({
  name: z.string().trim().max(80).optional().default(""),
  email: z.email({ message: "সঠিক ইমেইল ঠিকানা লিখুন।" }).trim().toLowerCase(),
  title: z.string().trim().min(8, { message: "প্রশ্নের শিরোনাম কমপক্ষে ৮ অক্ষরের হতে হবে।" }).max(200),
  question: z.string().trim().min(20, { message: "প্রশ্নটি একটু বিস্তারিত লিখুন (কমপক্ষে ২০ অক্ষর)।" }).max(5000),
  category_id: z.uuid().optional().or(z.literal("").transform(() => undefined)),
  privacy: z.enum(["public", "private"]),
  notify: z.boolean(),
  // Honeypot: real people never fill this hidden field.
  website: z.string().max(0).optional().default(""),
});

export async function submitQuestion(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!hasSupabaseAdmin()) return { ok: false, message: "প্রশ্ন গ্রহণ ব্যবস্থা এখন সাময়িকভাবে বন্ধ। পরে আবার চেষ্টা করুন।" };
  const parsed = schema.safeParse({ ...Object.fromEntries(formData), notify: formData.get("notify") === "on" });
  if (!parsed.success) {
    if (parsed.error.issues.some((i) => i.path[0] === "website")) return { ok: true, message: "জাযাকাল্লাহু খাইরান! আপনার প্রশ্ন জমা হয়েছে।" };
    return { ok: false, message: "তথ্যগুলো ঠিকভাবে পূরণ করুন।", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const d = parsed.data;
  const admin = createAdminClient();

  // Simple abuse limit: at most 3 questions per email per 24 hours.
  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { count } = await admin.from("questions").select("id", { count: "exact", head: true }).eq("asker_email", d.email).gte("created_at", since);
  if ((count ?? 0) >= 3) return { ok: false, message: "২৪ ঘণ্টায় সর্বোচ্চ ৩টি প্রশ্ন পাঠানো যায়। আগের প্রশ্নগুলোর উত্তরের অপেক্ষা করুন।" };

  const user = await getSessionUser();
  const h = await headers();
  const { error } = await admin.from("questions").insert({
    title: d.title,
    question: d.question,
    category_id: d.category_id ?? null,
    asker_id: user?.id ?? null,
    asker_email: d.email,
    asker_name: d.name || null,
    is_public: d.privacy === "public",
    notify_email: d.notify,
    status: "pending",
  });
  if (error) {
    console.error("[ask]", error.message, h.get("x-forwarded-for"));
    return { ok: false, message: "প্রশ্ন জমা দেওয়া যায়নি। আবার চেষ্টা করুন।" };
  }
  return {
    ok: true,
    message: d.notify
      ? "জাযাকাল্লাহু খাইরান! আপনার প্রশ্ন জমা হয়েছে। উত্তর প্রকাশিত হলে ইনশাআল্লাহ ইমেইলে জানানো হবে।"
      : "জাযাকাল্লাহু খাইরান! আপনার প্রশ্ন জমা হয়েছে। ইনশাআল্লাহ শীঘ্রই উত্তর দেওয়া হবে।",
  };
}
