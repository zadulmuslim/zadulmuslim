import { NextResponse } from "next/server";
import { cleanupStaleMedia } from "@/lib/storage";
import { cronSecret } from "@/lib/env";

/** Vercel Cron (see vercel.json): removes abandoned uploads and retries failed deletes. */
export async function GET(request: Request) {
  const secret = cronSecret();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await cleanupStaleMedia(24));
}
