import { NextResponse } from "next/server";
import { cleanupStaleMedia } from "@/lib/storage";
import { serverEnv } from "@/lib/env";

/** Vercel Cron (see vercel.json): removes abandoned uploads and retries failed deletes. */
export async function GET(request: Request) {
  const secret = serverEnv().CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await cleanupStaleMedia(24));
}
