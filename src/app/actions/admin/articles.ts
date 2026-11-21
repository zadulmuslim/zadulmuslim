"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { actionUser } from "@/lib/auth/action-guard";
import { slugify } from "@/lib/format";
import type { FormState } from "@/components/ui/form-message";

const optionalUuid = z.uuid().optional().or(z.literal("").transform(() => undefined));

const schema = z.object({
  id: optionalUuid,
  title: z.string().trim().min(3, { message: "শিরোনাম লিখুন।" }).max(250),
  slug: z.string().trim().max(120).optional().default(""),
  excerpt: z.string().trim().max(500).optional().default(""),
  body: z.string().max(200000).optional().default(""),
  category_id: optionalUuid,
  author_name: z.string().trim().max(120).optional().default(""),
  featured_media_id: optionalUuid,
  inline_media_ids: z.string().optional().default(""),
  intent: z.enum(["draft", "publish", "archive"]),
});

/** Bengali reading speed ≈ 180 words/minute. */
function readingMinutes(body: string): number {
  const words = body.replace(/[#>*_`!\[\]()-]/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

export async function saveArticle(_prev: FormState, formData: FormData): Promise<FormState> {
  const auth = await actionUser("editor");
  if (!auth.user) return { ok: false, message: auth.error };

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "তথ্যগুলো ঠিকভাবে পূরণ করুন।", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const d = parsed.data;
  if (d.intent === "publish" && d.body.trim().length < 50) {
    return { ok: false, message: "প্রকাশ করার আগে প্রবন্ধের মূল লেখা দিন।", fieldErrors: { body: ["লেখা খুব ছোট।"] } };
  }

  const supabase = await createClient();
  const existing = d.id ? (await supabase.from("articles").select("published_at, author_id").eq("id", d.id).maybeSingle()).data : null;
  if (d.id && !existing) return { ok: false, message: "প্রবন্ধটি পাওয়া যায়নি।" };

  const status = d.intent === "publish" ? "published" : d.intent === "archive" ? "archived" : "draft";
  const row = {
    title: d.title,
    slug: slugify(d.slug || d.title) || `article-${Date.now()}`,
    excerpt: d.excerpt || null,
    body: d.body,
    category_id: d.category_id ?? null,
    author_name: d.author_name || null,
    featured_media_id: d.featured_media_id ?? null,
    reading_minutes: readingMinutes(d.body),
    status,
    author_id: existing?.author_id ?? auth.user.id,
    published_at: status === "published" ? (existing?.published_at ?? new Date().toISOString()) : (existing?.published_at ?? null),
  } as const;

  let id = d.id;
  if (id) {
    const { error } = await supabase.from("articles").update(row).eq("id", id);
    if (error) return dbError(error);
  } else {
    const { data, error } = await supabase.from("articles").insert(row).select("id").single();
    if (error || !data) return dbError(error);
    id = data.id;
  }

  // Link inline images uploaded while editing (keeps the media ↔ article relation).
  const inline = d.inline_media_ids.split(",").filter((x) => z.uuid().safeParse(x).success);
  if (inline.length) {
    await supabase.from("article_media").upsert(inline.map((media_id, position) => ({ article_id: id!, media_id, position })), { ignoreDuplicates: true });
  }

  revalidatePath("/admin/articles");
  revalidatePath("/admin");
  revalidatePath("/articles");
  if (!d.id) redirect(`/admin/articles/${id}?saved=1`);
  const messages = { draft: "খসড়া সংরক্ষিত হয়েছে।", publish: "প্রবন্ধ প্রকাশিত হয়েছে।", archive: "প্রবন্ধটি আর্কাইভ করা হয়েছে।" };
  return { ok: true, message: messages[d.intent] };
}

export async function deleteArticle(formData: FormData): Promise<void> {
  const auth = await actionUser("editor");
  if (!auth.user) throw new Error(auth.error);
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("articles").delete().eq("id", id);
  revalidatePath("/admin/articles");
  revalidatePath("/admin");
  redirect("/admin/articles?deleted=1");
}

function dbError(error: { code?: string } | null): FormState {
  if (error?.code === "23505") return { ok: false, message: "এই স্লাগ দিয়ে আগেই একটি প্রবন্ধ আছে। অন্য স্লাগ দিন।", fieldErrors: { slug: ["স্লাগটি আগে ব্যবহৃত।"] } };
  return { ok: false, message: "সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।" };
}
