import { NextResponse } from "next/server";
import { cleanupStaleMedia } from "@/lib/storage";
import { cronSecret, hasSupabaseAdmin } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

/** Vercel Cron (see vercel.json): removes abandoned uploads and retries failed deletes. */
export async function GET(request: Request) {
  const secret = cronSecret();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const media = await cleanupStaleMedia(24);
  // Security housekeeping: spent captchas and expired login codes.
  if (hasSupabaseAdmin()) {
    const now = new Date().toISOString();
    const db = createAdminClient();
    await Promise.all([db.from("captcha_used").delete().lt("expires_at", now), db.from("login_otps").delete().lt("expires_at", now)]);
  }
  return NextResponse.json(media);
}
