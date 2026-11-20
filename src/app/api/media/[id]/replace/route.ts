import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { initiateReplace } from "@/lib/storage";
import { errorResponse, noStore, uuidParam } from "@/lib/api/http";
import { replaceRequestSchema } from "@/lib/api/schemas";

/**
 * POST /api/media/:id/replace — presigned upload for a new version of a file.
 * After the PUT, call /api/media/uploads/:newId/complete; the original id is
 * kept, so every article/book/lecture referencing it updates automatically.
 */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const id = uuidParam.parse((await ctx.params).id);
    const body = replaceRequestSchema.parse(await request.json());
    const upload = await initiateReplace(await getSessionUser(), id, body);
    return NextResponse.json(upload, { status: 201, headers: noStore });
  } catch (err) {
    return errorResponse(err);
  }
}
