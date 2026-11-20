import { randomUUID } from "node:crypto";
import { CATEGORY_RULES, MIME_EXTENSIONS, type MediaCategory } from "./categories";
import { fileExtension } from "./validation";

/** ASCII-safe slug of the original name (Bengali names fall back to "file"). */
export function slugifyFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "");
  const slug = base
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "file";
}

/**
 * Organised, unguessable object key:
 *   <prefix><yyyy>/<mm>/<uuid>-<slug>.<ext>
 * e.g. articles/2026/11/3f2c…-taqlid-keno-joruri.webp
 * Private objects stored in the shared bucket get a leading "private/".
 */
export function buildObjectKey(opts: {
  category: MediaCategory;
  filename: string;
  mimeType: string;
  privateInSharedBucket?: boolean;
  now?: Date;
}): string {
  const { category, filename, mimeType, privateInSharedBucket, now = new Date() } = opts;
  const rule = CATEGORY_RULES[category];
  const allowedExts = MIME_EXTENSIONS[mimeType] ?? [];
  const given = fileExtension(filename);
  const ext = allowedExts.includes(given) ? given : (allowedExts[0] ?? "bin");
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const key = `${rule.prefix}${yyyy}/${mm}/${randomUUID()}-${slugifyFilename(filename)}.${ext}`;
  return privateInSharedBucket ? `private/${key}` : key;
}

/** Content-Disposition value that keeps a Bengali filename readable on download. */
export function contentDisposition(filename: string, inline = false): string {
  const fallback = filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `${inline ? "inline" : "attachment"}; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
