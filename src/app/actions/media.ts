"use server";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { deleteMedia, toPublicMedia, uploadFromServer, StorageError } from "@/lib/storage";
import { createAdminClient } from "@/lib/supabase/admin";
import { ConfigError } from "@/lib/env";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const fail = (err: unknown): { ok: false; error: string } => ({
  ok: false,
  error:
    err instanceof StorageError ? err.message
    : err instanceof ConfigError ? "ফাইল আপলোড সাময়িকভাবে বন্ধ আছে। কিছুক্ষণ পর আবার চেষ্টা করুন।"
    : "দুঃখিত, একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।",
});

/** Server Action: replace the signed-in user's profile photo (small image, server-side upload). */
export async function updateProfilePhoto(formData: FormData): Promise<ActionResult<{ url: string }>> {
  try {
    const user = await getSessionUser();
    const file = formData.get("file");
    if (!(file instanceof File)) throw new StorageError("ফাইল পাওয়া যায়নি।");
    const media = await uploadFromServer(user, { category: "profile", file });

    const admin = createAdminClient();
    const { error: setErr } = await admin.from("profiles").update({ avatar_media_id: media.id }).eq("id", media.owner_id!);
    if (setErr) throw setErr;

    // Remove every earlier profile photo of this user from R2 and the database.
    const { data: old } = await admin.from("media").select("id").eq("owner_id", media.owner_id!).eq("category", "profile").neq("id", media.id);
    for (const { id } of old ?? []) {
      await deleteMedia(user, id).catch((e) => console.error("[avatar] old photo not deleted", id, e));
    }

    revalidatePath("/account");
    return { ok: true, data: { url: toPublicMedia(media).url } };
  } catch (err) {
    return fail(err);
  }
}
