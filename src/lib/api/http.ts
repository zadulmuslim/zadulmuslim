import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { StorageError } from "@/lib/storage";
import { ConfigError } from "@/lib/env";

export const uuidParam = z.uuid();

/** Uniform JSON error responses; never leak internals. */
export function errorResponse(err: unknown) {
  if (err instanceof StorageError) {
    return NextResponse.json({ error: { code: err.code, message: err.message } }, { status: err.status });
  }
  if (err instanceof ConfigError) {
    console.error("[config]", err.message);
    const message =
      err.feature === "r2"
        ? "ফাইল আপলোড সাময়িকভাবে বন্ধ আছে। কিছুক্ষণ পর আবার চেষ্টা করুন।"
        : "সাময়িক একটি কারিগরি সমস্যা হয়েছে। অনুগ্রহ করে পরে চেষ্টা করুন।";
    return NextResponse.json({ error: { code: "not_configured", message } }, { status: 503 });
  }
  if (err instanceof z.ZodError) {
    return NextResponse.json({ error: { code: "invalid_request", message: "অনুরোধটি সঠিক নয়।", issues: err.issues } }, { status: 400 });
  }
  console.error("[media]", err);
  return NextResponse.json({ error: { code: "internal_error", message: "দুঃখিত, একটি কারিগরি সমস্যা হয়েছে। আবার চেষ্টা করুন।" } }, { status: 500 });
}

export const noStore = { "Cache-Control": "no-store" };
