import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { completeUpload, toPublicMedia } from "@/lib/storage";
import { errorResponse, noStore, uuidParam } from "@/lib/api/http";

/** POST /api/media/uploads/:id/complete — verify the uploaded object and mark it ready. */
export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const id = uuidParam.parse((await ctx.params).id);
    const row = await completeUpload(await getSessionUser(), id);
    return NextResponse.json(toPublicMedia(row), { headers: noStore });
  } catch (err) {
    return errorResponse(err);
  }
}
