import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { isMediaCategory, toPublicMedia, uploadFromServer, StorageError } from "@/lib/storage";
import { errorResponse, noStore } from "@/lib/api/http";

/**
 * POST /api/media/direct (multipart/form-data: file, category, altText?)
 * Server-side upload for small images such as profile photos and inline
 * article images. Vercel limits request bodies to ~4.5 MB — use the
 * presigned flow (/api/media/uploads) for anything larger.
 */
const DIRECT_LIMIT = 4 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const category = form.get("category");
    const altText = form.get("altText");
    if (!(file instanceof File)) throw new StorageError("ফাইল পাওয়া যায়নি।", 400, "missing_file");
    if (!isMediaCategory(category)) throw new StorageError("বিভাগ সঠিক নয়।", 400, "invalid_category");
    if (file.size > DIRECT_LIMIT) throw new StorageError("বড় ফাইলের জন্য সরাসরি আপলোড ব্যবহার করুন।", 413, "use_presigned");

    const row = await uploadFromServer(await getSessionUser(), {
      category,
      file,
      altText: typeof altText === "string" ? altText : null,
    });
    return NextResponse.json(toPublicMedia(row), { status: 201, headers: noStore });
  } catch (err) {
    return errorResponse(err);
  }
}
