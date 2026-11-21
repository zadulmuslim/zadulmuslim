import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { deleteMedia, getMedia } from "@/lib/storage";
import { logActivity } from "@/lib/audit";
import { errorResponse, noStore, uuidParam } from "@/lib/api/http";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/media/:id — metadata the viewer is allowed to see. */
export async function GET(_request: Request, ctx: Ctx) {
  try {
    const id = uuidParam.parse((await ctx.params).id);
    return NextResponse.json(await getMedia(await getSessionUser(), id), { headers: noStore });
  } catch (err) {
    return errorResponse(err);
  }
}

/** DELETE /api/media/:id — remove from R2 and PostgreSQL (owner or editor/admin). */
export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const id = uuidParam.parse((await ctx.params).id);
    const user = await getSessionUser();
    const info = await getMedia(user, id).catch(() => null);
    await deleteMedia(user, id);
    if (user) await logActivity(user, { action: "media.delete", entity: "media", entityId: id, summary: `ফাইল মুছে ফেলা হয়েছে: ${info?.filename ?? id}` });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return errorResponse(err);
  }
}
