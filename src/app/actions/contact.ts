"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdmin } from "@/lib/env";
import { getSessionUser } from "@/lib/auth/session";
import { verifyCaptcha } from "@/lib/captcha";
import { brandedEmail, escapeHtml, sendEmail } from "@/lib/email";
import { siteConfig } from "@/config/site";
import { CONTACT_TOPICS, TOPIC_LABEL } from "@/config/contact";
import { actionUser } from "@/lib/auth/action-guard";
import type { FormState } from "@/components/ui/form-message";

const schema = z.object({
  name: z.string().trim().min(2, { message: "আপনার নাম লিখুন।" }).max(80),
  email: z.email({ message: "সঠিক ইমেইল ঠিকানা লিখুন।" }).trim().toLowerCase().max(200),
  topic: z.enum(CONTACT_TOPICS.map((t) => t.value) as [string, ...string[]], { message: "বিষয়ের ধরন বেছে নিন।" }),
  subject: z.string().trim().min(4, { message: "বিষয় কমপক্ষে ৪ অক্ষরের হতে হবে।" }).max(150),
  message: z.string().trim().min(20, { message: "বার্তাটি একটু বিস্তারিত লিখুন (কমপক্ষে ২০ অক্ষর)।" }).max(5000),
  page_url: z.string().trim().max(300).optional().default(""),
  website: z.string().max(0).optional().default(""), // honeypot
});

export async function sendContactMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!hasSupabaseAdmin()) return { ok: false, message: "বার্তা পাঠানোর ব্যবস্থা এখন সাময়িকভাবে বন্ধ। সরাসরি ইমেইল করুন।" };
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    if (parsed.error.issues.some((i) => i.path[0] === "website")) return { ok: true, message: "জাযাকাল্লাহু খাইরান! আপনার বার্তা পৌঁছেছে।" };
    return { ok: false, message: "তথ্যগুলো ঠিকভাবে পূরণ করুন।", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const captcha = await verifyCaptcha(formData);
  if (!captcha.ok) return { ok: false, message: captcha.message, fieldErrors: { captcha_answer: [captcha.message] } };
  const d = parsed.data;
  const db = createAdminClient();

  // At most 3 messages per email in 24 hours.
  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { count } = await db.from("contact_messages").select("id", { count: "exact", head: true }).eq("email", d.email).gte("created_at", since);
  if ((count ?? 0) >= 3) return { ok: false, message: "২৪ ঘণ্টায় সর্বোচ্চ ৩টি বার্তা পাঠানো যায়। আমরা আগের বার্তার উত্তর দেব ইনশাআল্লাহ।" };

  const user = await getSessionUser();
  const pageUrl = d.page_url.startsWith("/") ? d.page_url : "";
  const { data: row, error } = await db
    .from("contact_messages")
    .insert({ name: d.name, email: d.email, topic: d.topic, subject: d.subject, message: d.message, page_url: pageUrl || null, user_id: user?.id ?? null })
    .select("id")
    .single();
  if (error || !row) {
    console.error("[contact]", error?.message, (await headers()).get("x-forwarded-for"));
    return { ok: false, message: "বার্তা পাঠানো যায়নি। আবার চেষ্টা করুন অথবা সরাসরি ইমেইল করুন।" };
  }

  // Notify the team (reply goes straight to the sender) and acknowledge the sender.
  const topic = TOPIC_LABEL[d.topic] ?? d.topic;
  const lines = escapeHtml(d.message).replace(/\n/g, "<br>");
  await Promise.all([
    sendEmail({
      to: siteConfig.contact.email,
      replyTo: d.email,
      subject: `[যোগাযোগ] ${d.subject}`,
      html: brandedEmail({
        heading: "যোগাযোগ পাতা থেকে নতুন বার্তা",
        paragraphs: [
          `<strong>নাম:</strong> ${escapeHtml(d.name)}<br><strong>ইমেইল:</strong> ${escapeHtml(d.email)}<br><strong>ধরন:</strong> ${escapeHtml(topic)}${pageUrl ? `<br><strong>পাতা:</strong> ${escapeHtml(pageUrl)}` : ""}`,
          `<strong>বিষয়:</strong> ${escapeHtml(d.subject)}`,
          lines,
          "এই ইমেইলের উত্তর দিলে সরাসরি প্রেরকের কাছে যাবে।",
        ],
        button: { label: "অ্যাডমিন প্যানেলে দেখুন", url: `${siteConfig.url}/admin/messages` },
      }),
      text: `নাম: ${d.name}\nইমেইল: ${d.email}\nধরন: ${topic}\nবিষয়: ${d.subject}\n\n${d.message}`,
    }),
    sendEmail({
      to: d.email,
      subject: "আপনার বার্তা পেয়েছি — যাদুল মুসলিম",
      html: brandedEmail({
        heading: "আপনার বার্তা আমাদের কাছে পৌঁছেছে",
        paragraphs: [
          `প্রিয় ${escapeHtml(d.name)}, যোগাযোগ করার জন্য জাযাকাল্লাহু খাইরান। আপনার বার্তা (“${escapeHtml(d.subject)}”) আমরা পেয়েছি এবং ইনশাআল্লাহ যত দ্রুত সম্ভব উত্তর দেব।`,
          "শরঈ কোনো প্রশ্ন থাকলে তা “প্রশ্ন করুন” পাতা থেকে পাঠালে আলেমগণ যাচাই করে উত্তর দেবেন।",
        ],
        button: { label: "যাদুল মুসলিমে যান", url: siteConfig.url },
      }),
      text: `প্রিয় ${d.name}, আপনার বার্তা (“${d.subject}”) আমরা পেয়েছি। ইনশাআল্লাহ যত দ্রুত সম্ভব উত্তর দেব।\n\n— ${siteConfig.nameBn}`,
    }),
  ]);
  revalidatePath("/admin/messages");
  return { ok: true, message: "জাযাকাল্লাহু খাইরান! আপনার বার্তা পৌঁছেছে। আপনার ইমেইলে একটি নিশ্চিতকরণ পাঠানো হয়েছে, ইনশাআল্লাহ শীঘ্রই উত্তর দেব।" };
}

/** Staff: change a message's status or delete it. */
export async function updateContactMessage(id: string, op: "read" | "replied" | "archived" | "new" | "delete"): Promise<{ error?: string }> {
  const { user, error } = await actionUser("editor");
  if (!user) return { error };
  if (!z.uuid().safeParse(id).success) return { error: "বার্তাটি পাওয়া যায়নি।" };
  const db = createAdminClient();
  const res = op === "delete" ? await db.from("contact_messages").delete().eq("id", id) : await db.from("contact_messages").update({ status: op }).eq("id", id);
  if (res.error) return { error: "সম্ভব হয়নি, আবার চেষ্টা করুন।" };
  revalidatePath("/admin/messages");
  revalidatePath("/admin", "layout");
  return {};
}
