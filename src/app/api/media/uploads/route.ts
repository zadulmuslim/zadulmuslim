import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { initiateUpload, type MediaCategory } from "@/lib/storage";
import { errorResponse, noStore } from "@/lib/api/http";
import { uploadRequestSchema } from "@/lib/api/schemas";

/**
 * POST /api/media/uploads
 * Body: { category, filename, mimeType, size, visibility?, altText? }
 * Returns a presigned PUT URL; the browser uploads the file directly to R2,
 * then calls POST /api/media/uploads/:id/complete.
 */
export async function POST(request: Request) {
  try {
    const body = uploadRequestSchema.parse(await request.json());
    const user = await getSessionUser();
    const upload = await initiateUpload(user, { ...body, category: body.category as MediaCategory });
    return NextResponse.json(upload, { status: 201, headers: noStore });
  } catch (err) {
    return errorResponse(err);
  }
}
