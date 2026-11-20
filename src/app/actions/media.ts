"use server";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { deleteMedia, toPublicMedia, uploadFromServer, StorageError } from "@/lib/storage";
import { createAdminClient } from "@/lib/supabase/admin";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const fail = (err: unknown): { ok: false; error: string } => ({
  ok: false,
  error: err instanceof StorageError ? err.message : "কিছু একটা সমস্যা হয়েছে।",
});

/** Server Action: replace the signed-in user's profile photo (small image, server-side upload). */
export async function updateProfilePhoto(formData: FormData): Promise<ActionResult<{ url: string }>> {
  try {
    const user = await getSessionUser();
    const file = formData.get("file");
    if (!(file instanceof File)) throw new StorageError("ফাইল পাওয়া যায়নি।");
    const media = await uploadFromServer(user, { category: "profile", file });

    const admin = createAdminClient();
    const { data: prev } = await admin.from("profiles").select("avatar_media_id").eq("id", media.owner_id!).single();
    await admin.from("profiles").update({ avatar_media_id: media.id }).eq("id", media.owner_id!);
    const prevId = (prev as { avatar_media_id: string | null } | null)?.avatar_media_id;
    if (prevId) await deleteMedia(user, prevId).catch(() => undefined);

    revalidatePath("/account");
    return { ok: true, data: { url: toPublicMedia(media).url } };
  } catch (err) {
    return fail(err);
  }
}
