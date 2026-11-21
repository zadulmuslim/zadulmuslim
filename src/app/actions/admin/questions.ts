"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { actionUser } from "@/lib/auth/action-guard";
import { slugify } from "@/lib/format";
import type { FormState } from "@/components/ui/form-message";

const schema = z.object({
  id: z.uuid().optional().or(z.literal("").transform(() => undefined)),
  title: z.string().trim().min(5, { message: "শিরোনাম কমপক্ষে ৫ অক্ষরের হতে হবে।" }).max(250),
  question: z.string().trim().min(5, { message: "প্রশ্নটি লিখুন।" }).max(10000),
  answer: z.string().trim().max(50000).optional().default(""),
  category_id: z.uuid().optional().or(z.literal("").transform(() => undefined)),
  slug: z.string().trim().max(120).optional().default(""),
  is_public: z.boolean(),
  intent: z.enum(["save", "publish", "unpublish", "reject"]),
});

export async function saveQuestion(_prev: FormState, formData: FormData): Promise<FormState> {
  const auth = await actionUser("editor");
  if (!auth.user) return { ok: false, message: auth.error };

  const parsed = schema.safeParse({
    ...Object.fromEntries(formData),
    is_public: formData.get("is_public") === "on",
  });
  if (!parsed.success) return { ok: false, message: "তথ্যগুলো ঠিকভাবে পূরণ করুন।", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const d = parsed.data;

  if (d.intent === "publish" && d.answer.length < 10) {
    return { ok: false, message: "প্রকাশ করার আগে উত্তর লিখুন।", fieldErrors: { answer: ["উত্তর লিখুন।"] } };
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  // Existing row (to keep first-publish timestamps and decide status for "save").
  const existing = d.id
    ? (await supabase.from("questions").select("status, answered_at, published_at, answered_by").eq("id", d.id).maybeSingle()).data
    : null;
  if (d.id && !existing) return { ok: false, message: "প্রশ্নটি পাওয়া যায়নি।" };

  const status =
    d.intent === "publish" ? "answered"
    : d.intent === "reject" ? "rejected"
    : d.intent === "unpublish" ? "in_review"
    : existing?.status === "answered" ? "answered"
    : "in_review";

  const row = {
    title: d.title,
    question: d.question,
    answer: d.answer || null,
    category_id: d.category_id ?? null,
    is_public: d.is_public,
    status,
    slug: d.slug ? slugify(d.slug) : null,
    ...(status === "answered"
      ? {
          answered_by: existing?.answered_by ?? auth.user.id,
          answered_at: existing?.answered_at ?? now,
          published_at: existing?.published_at ?? now,
        }
      : {}),
  } as const;

  let id = d.id;
  if (id) {
    const { error } = await supabase.from("questions").update(row).eq("id", id);
    if (error) return dbError(error);
  } else {
    const { data, error } = await supabase.from("questions").insert(row).select("id").single();
    if (error || !data) return dbError(error);
    id = data.id;
  }

  // Readable, unique URL once published: "<bengali-title>-<id prefix>".
  if (status === "answered" && !row.slug) {
    await supabase.from("questions").update({ slug: `${slugify(d.title)}-${id.slice(0, 6)}` }).eq("id", id);
  }

  revalidatePath("/admin/questions");
  revalidatePath("/admin");
  revalidatePath("/qa");
  if (!d.id) redirect(`/admin/questions/${id}?saved=1`);
  const messages = {
    save: "সংরক্ষিত হয়েছে।",
    publish: "উত্তর প্রকাশিত হয়েছে।",
    unpublish: "প্রকাশ বন্ধ করা হয়েছে; প্রশ্নটি এখন পর্যালোচনায়।",
    reject: "প্রশ্নটি বাতিল করা হয়েছে।",
  };
  return { ok: true, message: messages[d.intent] };
}

export async function deleteQuestion(formData: FormData): Promise<void> {
  const auth = await actionUser("editor");
  if (!auth.user) throw new Error(auth.error);
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("questions").delete().eq("id", id);
  revalidatePath("/admin/questions");
  revalidatePath("/admin");
  redirect("/admin/questions?deleted=1");
}

function dbError(error: { code?: string } | null): FormState {
  if (error?.code === "23505") return { ok: false, message: "এই স্লাগটি আগেই ব্যবহার হয়েছে। অন্য স্লাগ দিন।", fieldErrors: { slug: ["স্লাগটি আগে ব্যবহৃত।"] } };
  return { ok: false, message: "সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।" };
}
