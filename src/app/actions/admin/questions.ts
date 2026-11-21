"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdmin } from "@/lib/env";
import { actionUser } from "@/lib/auth/action-guard";
import { logActivity } from "@/lib/audit";
import { slugify } from "@/lib/format";
import { brandedEmail, emailConfigured, escapeHtml, sendEmail } from "@/lib/email";
import { siteConfig } from "@/config/site";
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

function revalidateQa(slug?: string | null) {
  revalidatePath("/admin/questions");
  revalidatePath("/admin");
  revalidatePath("/qa");
  revalidatePath("/");
  if (slug) revalidatePath(`/qa/${slug}`);
}

/** Tell the asker their question was answered (once). Returns a short status note. */
async function notifyAsker(id: string): Promise<string | null> {
  if (!hasSupabaseAdmin()) return null;
  const admin = createAdminClient();
  const { data: q } = await admin
    .from("questions")
    .select("title, answer, slug, is_public, asker_email, asker_name, notify_email, notified_at, status")
    .eq("id", id)
    .maybeSingle();
  if (!q || q.status !== "answered" || !q.asker_email || !q.notify_email || q.notified_at) return null;
  if (!emailConfigured()) return "প্রশ্নকারীকে ইমেইল যায়নি (ইমেইল সেবা চালু নেই)।";

  const url = q.is_public && q.slug ? `${siteConfig.url}/qa/${encodeURIComponent(q.slug)}` : null;
  const paragraphs = [
    `আপনার প্রশ্ন <strong>“${escapeHtml(q.title)}”</strong>-এর উত্তর দেওয়া হয়েছে। জাযাকাল্লাহু খাইরান।`,
    ...(url ? [] : [escapeHtml(q.answer ?? "").replace(/\n/g, "<br>")]),
  ];
  const res = await sendEmail({
    to: q.asker_email,
    subject: `আপনার প্রশ্নের উত্তর দেওয়া হয়েছে — ${siteConfig.nameBn}`,
    html: brandedEmail({ heading: "আপনার প্রশ্নের উত্তর", paragraphs, button: url ? { label: "উত্তর পড়ুন", url } : undefined }),
    text: `আপনার প্রশ্ন "${q.title}"-এর উত্তর দেওয়া হয়েছে।\n${url ?? q.answer ?? ""}`,
  });
  if (!res.sent) return "প্রশ্নকারীকে ইমেইল পাঠানো যায়নি।";
  await admin.from("questions").update({ notified_at: new Date().toISOString() }).eq("id", id);
  return "প্রশ্নকারীকে ইমেইলে জানানো হয়েছে।";
}

export async function saveQuestion(_prev: FormState, formData: FormData): Promise<FormState> {
  const auth = await actionUser("editor");
  if (!auth.user) return { ok: false, message: auth.error };

  const parsed = schema.safeParse({ ...Object.fromEntries(formData), is_public: formData.get("is_public") === "on" });
  if (!parsed.success) return { ok: false, message: "তথ্যগুলো ঠিকভাবে পূরণ করুন।", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const d = parsed.data;

  if (d.intent === "publish" && d.answer.length < 10) {
    return { ok: false, message: "প্রকাশ করার আগে উত্তর লিখুন (কমপক্ষে ১০ অক্ষর)।", fieldErrors: { answer: ["উত্তর লিখুন।"] } };
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  const existing = d.id
    ? (await supabase.from("questions").select("status, answered_at, published_at, answered_by, slug").eq("id", d.id).maybeSingle()).data
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
    slug: d.slug ? slugify(d.slug) : (existing?.slug ?? null),
    ...(status === "answered"
      ? { answered_by: existing?.answered_by ?? auth.user.id, answered_at: existing?.answered_at ?? now, published_at: existing?.published_at ?? now }
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

  let slug = row.slug;
  if (status === "answered" && !slug) {
    slug = `${slugify(d.title)}-${id.slice(0, 6)}`;
    await supabase.from("questions").update({ slug }).eq("id", id);
  }

  const verb = { save: "সংরক্ষণ", publish: "প্রকাশ", unpublish: "প্রকাশ বন্ধ", reject: "বাতিল" }[d.intent];
  await logActivity(auth.user, { action: `question.${d.id ? d.intent : "create"}`, entity: "question", entityId: id, summary: `${verb}: ${d.title}` });

  const note = status === "answered" ? await notifyAsker(id) : null;
  revalidateQa(slug);
  if (!d.id) redirect(`/admin/questions/${id}?saved=1`);
  const messages = {
    save: "সংরক্ষিত হয়েছে।",
    publish: "উত্তর প্রকাশিত হয়েছে।",
    unpublish: "প্রকাশ বন্ধ করা হয়েছে; প্রশ্নটি এখন পর্যালোচনায়।",
    reject: "প্রশ্নটি বাতিল করা হয়েছে।",
  };
  return { ok: true, message: [messages[d.intent], note].filter(Boolean).join(" ") };
}

export async function deleteQuestion(formData: FormData): Promise<void> {
  const auth = await actionUser("editor");
  if (!auth.user) throw new Error(auth.error);
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  const { data } = await supabase.from("questions").select("title, slug").eq("id", id).maybeSingle();
  await supabase.from("questions").delete().eq("id", id);
  await logActivity(auth.user, { action: "question.delete", entity: "question", entityId: id, summary: `মুছে ফেলা হয়েছে: ${data?.title ?? ""}` });
  revalidateQa(data?.slug);
  redirect("/admin/questions?deleted=1");
}

/** Bulk actions from the list: publish | unpublish | reject | delete | category. */
export async function bulkQuestions(_prev: FormState, formData: FormData): Promise<FormState> {
  const auth = await actionUser("editor");
  if (!auth.user) return { ok: false, message: auth.error };
  const ids = formData.getAll("ids").map(String).filter((x) => z.uuid().safeParse(x).success);
  const op = z.enum(["publish", "unpublish", "reject", "delete", "category"]).safeParse(formData.get("op"));
  if (!ids.length) return { ok: false, message: "কোনো প্রশ্ন বাছাই করা হয়নি।" };
  if (!op.success) return { ok: false, message: "একটি কাজ বেছে নিন।" };

  const supabase = await createClient();
  let done = 0;
  let skipped = 0;
  const notes: string[] = [];

  if (op.data === "delete") {
    const { error, count } = await supabase.from("questions").delete({ count: "exact" }).in("id", ids);
    if (error) return { ok: false, message: "মুছে ফেলা যায়নি।" };
    done = count ?? ids.length;
  } else if (op.data === "category") {
    const cat = z.uuid().safeParse(formData.get("category_id"));
    if (!cat.success) return { ok: false, message: "বিষয় বেছে নিন।" };
    const { error, count } = await supabase.from("questions").update({ category_id: cat.data }, { count: "exact" }).in("id", ids);
    if (error) return { ok: false, message: "পরিবর্তন করা যায়নি।" };
    done = count ?? ids.length;
  } else if (op.data === "publish") {
    const { data: rows } = await supabase.from("questions").select("id, title, answer, slug, answered_at, published_at, answered_by").in("id", ids);
    const now = new Date().toISOString();
    for (const r of rows ?? []) {
      if ((r.answer ?? "").trim().length < 10) {
        skipped++;
        continue;
      }
      await supabase
        .from("questions")
        .update({
          status: "answered",
          answered_by: r.answered_by ?? auth.user.id,
          answered_at: r.answered_at ?? now,
          published_at: r.published_at ?? now,
          slug: r.slug ?? `${slugify(r.title)}-${r.id.slice(0, 6)}`,
        })
        .eq("id", r.id);
      const note = await notifyAsker(r.id);
      if (note && !notes.includes(note)) notes.push(note);
      done++;
    }
  } else {
    const status = op.data === "reject" ? "rejected" : "in_review";
    const { error, count } = await supabase.from("questions").update({ status }, { count: "exact" }).in("id", ids);
    if (error) return { ok: false, message: "পরিবর্তন করা যায়নি।" };
    done = count ?? ids.length;
  }

  const label = { publish: "প্রকাশ", unpublish: "প্রকাশ বন্ধ", reject: "বাতিল", delete: "মোছা", category: "বিষয় পরিবর্তন" }[op.data];
  await logActivity(auth.user, { action: `question.bulk_${op.data}`, entity: "question", summary: `একসাথে ${label}: ${done}টি প্রশ্ন`, metadata: { ids } });
  revalidateQa();
  return {
    ok: true,
    message: `${done}টি প্রশ্নে "${label}" সম্পন্ন।${skipped ? ` ${skipped}টি উত্তর ছাড়া থাকায় প্রকাশ করা হয়নি।` : ""} ${notes.join(" ")}`.trim(),
  };
}

function dbError(error: { code?: string } | null): FormState {
  if (error?.code === "23505") return { ok: false, message: "এই স্লাগটি আগেই ব্যবহার হয়েছে। অন্য স্লাগ দিন।", fieldErrors: { slug: ["স্লাগটি আগে ব্যবহৃত।"] } };
  return { ok: false, message: "সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।" };
}
