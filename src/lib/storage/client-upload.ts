"use client";
import type { MediaCategory, MediaVisibility } from "./categories";

/**
 * Browser helper for the presigned flow. Never sees R2 credentials:
 *   1. POST /api/media/uploads           → presigned PUT URL
 *   2. PUT file directly to R2            (progress reported)
 *   3. POST /api/media/uploads/:id/complete → server verifies & records
 */
export interface UploadedMedia {
  id: string;
  url: string;
  mimeType: string;
  size: number;
  filename: string;
}

async function json<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.message ?? "আপলোড ব্যর্থ হয়েছে।");
  return body as T;
}

function put(url: string, file: File, headers: Record<string, string>, onProgress?: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("R2 আপলোড ব্যর্থ হয়েছে।")));
    xhr.onerror = () => reject(new Error("নেটওয়ার্ক সমস্যা।"));
    xhr.send(file);
  });
}

export async function uploadFile(
  file: File,
  opts: { category: MediaCategory; visibility?: MediaVisibility; altText?: string; replaceId?: string; onProgress?: (pct: number) => void },
): Promise<UploadedMedia> {
  const payload = { filename: file.name, mimeType: file.type, size: file.size, altText: opts.altText };
  const initUrl = opts.replaceId ? `/api/media/${opts.replaceId}/replace` : "/api/media/uploads";
  const init = await json<{ mediaId: string; uploadUrl: string; headers: Record<string, string> }>(
    await fetch(initUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts.replaceId ? payload : { ...payload, category: opts.category, visibility: opts.visibility }),
    }),
  );
  await put(init.uploadUrl, file, init.headers, opts.onProgress);
  return json<UploadedMedia>(await fetch(`/api/media/uploads/${init.mediaId}/complete`, { method: "POST" }));
}
