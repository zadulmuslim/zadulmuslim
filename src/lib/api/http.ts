import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { StorageError } from "@/lib/storage";

export const uuidParam = z.uuid();

/** Uniform JSON error responses; never leak internals. */
export function errorResponse(err: unknown) {
  if (err instanceof StorageError) {
    return NextResponse.json({ error: { code: err.code, message: err.message } }, { status: err.status });
  }
  if (err instanceof z.ZodError) {
    return NextResponse.json({ error: { code: "invalid_request", message: "অনুরোধটি সঠিক নয়।", issues: err.issues } }, { status: 400 });
  }
  console.error("[media]", err);
  return NextResponse.json({ error: { code: "internal_error", message: "সার্ভারে সমস্যা হয়েছে।" } }, { status: 500 });
}

export const noStore = { "Cache-Control": "no-store" };
