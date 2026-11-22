import { NextResponse } from "next/server";
import { issueChallenge } from "@/lib/captcha";

export const dynamic = "force-dynamic";

/** Issues a fresh captcha challenge (image + signed token). Never cached. */
export function GET() {
  const headers = { "Cache-Control": "no-store, max-age=0" };
  return NextResponse.json(issueChallenge(), { headers });
}
