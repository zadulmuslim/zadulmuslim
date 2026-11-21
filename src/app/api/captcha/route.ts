import { NextResponse } from "next/server";
import { captchaEnabled, createChallenge } from "@/lib/captcha";

export const dynamic = "force-dynamic";

/** Issues a fresh captcha challenge (image + signed token). Never cached. */
export function GET() {
  const headers = { "Cache-Control": "no-store, max-age=0" };
  if (!captchaEnabled()) return NextResponse.json({ enabled: false }, { headers });
  return NextResponse.json({ enabled: true, ...createChallenge() }, { headers });
}
