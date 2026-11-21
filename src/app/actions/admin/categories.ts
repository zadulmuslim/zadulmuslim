"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { actionUser } from "@/lib/auth/action-guard";
import { logActivity } from "@/lib/audit";
import { slugify } from "@/lib/format";
import type { FormState } from "@/components/ui/form-message";

const TABLE = { question: "question_categories", article: "article_categories" } as const;

const schema = z.object({
  type: z.enum(["question", "article"]),
  id: z.uuid().optional().or(z.literal("").transform(() => undefined)),
  name_bn: z.string().trim().min(2, { message: "নাম লিখুন।" }).max(80),
  slug: z.string().trim().max(80).optional().default(""),
  description_bn: z.string().trim().max(300).optional().default(""),
  sort_order: z.coerce.number().int().min(0).max(999).default(0),
});

function revalidate() {
  revalidatePath("/admin/categories");
  revalidatePath("/qa");
  revalidatePath("/articles");
  revalidatePath("/");
}

export async function saveCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  const auth = await actionUser("editor");
  if (!auth.user) return { ok: false, message: auth.error };
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "তথ্য সঠিক নয়।" };
  const d = parsed.data;

  // ASCII slugs keep URLs short (?category=fiqh); fall back to a Bengali slug.
  const slug = slugify(d.slug || d.name_bn) || `category-${Date.now()}`;
  const supabase = await createClient();
  const base = { name_bn: d.name_bn, slug, sort_order: d.sort_order };
  let error: { code?: string } | null = null;
  if (d.type === "article") {
    const row = { ...base, description_bn: d.description_bn || null };
    ({ error } = d.id
      ? await supabase.from("article_categories").update(row).eq("id", d.id)
      : await supabase.from("article_categories").insert(row));
  } else {
    ({ error } = d.id
      ? await supabase.from("question_categories").update(base).eq("id", d.id)
      : await supabase.from("question_categories").insert(base));
  }
  if (error) return { ok: false, message: error.code === "23505" ? "এই স্লাগ দিয়ে আগেই একটি বিষয় আছে।" : "সংরক্ষণ করা যায়নি।" };

  await logActivity(auth.user, {
    action: d.id ? "category.update" : "category.create",
    entity: "category",
    entityId: d.id ?? slug,
    summary: `${d.type === "article" ? "প্রবন্ধ" : "প্রশ্নোত্তর"} বিষয়: ${d.name_bn}`,
  });
  revalidate();
  return { ok: true, message: d.id ? "সংরক্ষিত হয়েছে।" : "নতুন বিষয় যোগ হয়েছে।" };
}

export async function deleteCategory(formData: FormData): Promise<void> {
  const auth = await actionUser("editor");
  if (!auth.user) throw new Error(auth.error);
  const type = z.enum(["question", "article"]).parse(formData.get("type"));
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  const { data } = await supabase.from(TABLE[type]).select("name_bn").eq("id", id).maybeSingle();
  // Posts in this category keep existing; their category becomes empty (FK on delete set null).
  await supabase.from(TABLE[type]).delete().eq("id", id);
  await logActivity(auth.user, { action: "category.delete", entity: "category", entityId: id, summary: `বিষয় মুছে ফেলা হয়েছে: ${data?.name_bn ?? ""}` });
  revalidate();
}
