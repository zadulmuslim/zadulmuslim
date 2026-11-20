import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SessionUser } from "@/lib/auth/session";
import {
  CATEGORY_RULES,
  roleAtLeast,
  type MediaCategory,
  type MediaVisibility,
} from "./categories";
import { buildObjectKey, contentDisposition } from "./keys";
import * as r2 from "./r2";
import { StorageError, assertContentMatches, sniffMimeType, validateUpload } from "./validation";

/**
 * The ONE place the app manages files.
 * Binary data lives in Cloudflare R2; metadata (key, URL, MIME type, size,
 * owner, visibility) lives in the Supabase PostgreSQL `media` table.
 */

export interface MediaRow {
  id: string;
  category: MediaCategory;
  visibility: MediaVisibility;
  bucket: string;
  object_key: string;
  public_url: string | null;
  mime_type: string;
  size_bytes: number;
  original_filename: string;
  alt_text: string | null;
  status: "pending" | "ready" | "deleted";
  owner_id: string | null;
  replaces_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UploadRequest {
  category: MediaCategory;
  filename: string;
  mimeType: string;
  size: number;
  visibility?: MediaVisibility;
  altText?: string | null;
}

export interface PresignedUpload {
  mediaId: string;
  objectKey: string;
  uploadUrl: string;
  method: "PUT";
  headers: Record<string, string>;
  expiresIn: number;
}

const PUBLIC_CACHE = "public, max-age=31536000, immutable"; // keys are unique, so safe to cache forever
const PRIVATE_CACHE = "private, max-age=0, no-store";

const db = () => createAdminClient();

const isStaff = (user: SessionUser) => roleAtLeast(user.role, "editor");

function assertCanUpload(user: SessionUser | null, category: MediaCategory): asserts user is SessionUser {
  if (!user) throw new StorageError("লগইন প্রয়োজন।", 401, "unauthenticated");
  if (!roleAtLeast(user.role, CATEGORY_RULES[category].minRole)) {
    throw new StorageError("এই বিভাগে আপলোডের অনুমতি নেই।", 403, "forbidden");
  }
}

function assertCanManage(user: SessionUser | null, row: MediaRow): asserts user is SessionUser {
  if (!user) throw new StorageError("লগইন প্রয়োজন।", 401, "unauthenticated");
  if (!(isStaff(user) || row.owner_id === user.id)) {
    throw new StorageError("এই ফাইল পরিবর্তনের অনুমতি নেই।", 403, "forbidden");
  }
}

function resolveVisibility(user: SessionUser, req: UploadRequest): MediaVisibility {
  const fallback = CATEGORY_RULES[req.category].defaultVisibility;
  // Only staff may override a category's default visibility.
  return req.visibility && isStaff(user) ? req.visibility : fallback;
}

async function getRow(id: string): Promise<MediaRow> {
  const { data, error } = await db().from("media").select("*").eq("id", id).maybeSingle();
  if (error) throw new StorageError("ডেটাবেস ত্রুটি।", 500, "db_error");
  if (!data) throw new StorageError("ফাইল পাওয়া যায়নি।", 404, "not_found");
  return data as MediaRow;
}

async function insertPending(user: SessionUser, req: UploadRequest, replacesId: string | null): Promise<{ row: MediaRow; upload: PresignedUpload }> {
  validateUpload(req);
  const visibility = resolveVisibility(user, req);
  const { bucket, privateInSharedBucket } = r2.bucketFor(visibility);
  const objectKey = buildObjectKey({ category: req.category, filename: req.filename, mimeType: req.mimeType, privateInSharedBucket });
  const cacheControl = visibility === "public" ? PUBLIC_CACHE : PRIVATE_CACHE;

  const { data, error } = await db()
    .from("media")
    .insert({
      category: req.category,
      visibility,
      bucket,
      object_key: objectKey,
      public_url: visibility === "public" ? r2.publicUrlFor(objectKey) : null,
      mime_type: req.mimeType,
      size_bytes: req.size,
      original_filename: req.filename.slice(0, 255),
      alt_text: req.altText ?? null,
      status: "pending",
      owner_id: user.id,
      replaces_id: replacesId,
    })
    .select("*")
    .single();
  if (error || !data) throw new StorageError("আপলোড শুরু করা যায়নি।", 500, "db_error");
  const row = data as MediaRow;

  const signed = await r2.presignPut({ bucket, key: objectKey, contentType: req.mimeType, contentLength: req.size, cacheControl });
  return {
    row,
    upload: { mediaId: row.id, objectKey, uploadUrl: signed.url, method: "PUT", headers: signed.headers, expiresIn: signed.expiresIn },
  };
}

/** Step 1 of a browser upload: validate, reserve a key, return a presigned PUT URL. */
export async function initiateUpload(user: SessionUser | null, req: UploadRequest): Promise<PresignedUpload> {
  assertCanUpload(user, req.category);
  return (await insertPending(user, req, null)).upload;
}

/** Step 1 of replacing a file: same as upload, linked to the media row being replaced. */
export async function initiateReplace(user: SessionUser | null, mediaId: string, req: Omit<UploadRequest, "category" | "visibility">): Promise<PresignedUpload> {
  const original = await getRow(mediaId);
  assertCanManage(user, original);
  if (original.status !== "ready") throw new StorageError("এই ফাইলটি প্রতিস্থাপনযোগ্য নয়।", 409, "invalid_state");
  return (await insertPending(user, { ...req, category: original.category, visibility: original.visibility }, original.id)).upload;
}

/** Remove a rejected/abandoned upload from both R2 and the database. */
async function discard(row: MediaRow): Promise<void> {
  await r2.deleteObject(row.bucket, row.object_key);
  await db().from("media").delete().eq("id", row.id);
}

/**
 * Step 2: after the browser PUT succeeds, verify the object really is what was
 * declared (exists, exact size, real file type) and mark it ready. For a
 * replacement, swap the new object into the original row and delete the old one.
 */
export async function completeUpload(user: SessionUser | null, mediaId: string): Promise<MediaRow> {
  const row = await getRow(mediaId);
  assertCanManage(user, row);
  if (row.status !== "pending") throw new StorageError("আপলোড ইতিমধ্যে সম্পন্ন হয়েছে।", 409, "invalid_state");

  const head = await r2.headObject(row.bucket, row.object_key);
  if (!head) throw new StorageError("ফাইলটি এখনো আপলোড হয়নি।", 409, "not_uploaded");

  try {
    if (head.size !== row.size_bytes) throw new StorageError("ফাইলের আকার মিলছে না।", 400, "size_mismatch");
    assertContentMatches(row.mime_type, await r2.readObjectHead(row.bucket, row.object_key));
  } catch (err) {
    await discard(row);
    throw err;
  }

  if (!row.replaces_id) {
    const { data, error } = await db().from("media").update({ status: "ready" }).eq("id", row.id).select("*").single();
    if (error || !data) throw new StorageError("ডেটাবেস ত্রুটি।", 500, "db_error");
    return data as MediaRow;
  }

  // Replacement: keep the original id (so articles/books keep their references).
  const original = await getRow(row.replaces_id);
  const { data, error } = await db()
    .from("media")
    .update({
      bucket: row.bucket,
      object_key: row.object_key,
      public_url: row.public_url,
      mime_type: row.mime_type,
      size_bytes: row.size_bytes,
      original_filename: row.original_filename,
      alt_text: row.alt_text ?? original.alt_text,
    })
    .eq("id", original.id)
    .select("*")
    .single();
  if (error || !data) throw new StorageError("ফাইল প্রতিস্থাপন ব্যর্থ হয়েছে।", 500, "db_error");
  await db().from("media").delete().eq("id", row.id);
  await r2.deleteObject(original.bucket, original.object_key).catch(() => {
    /* orphaned old object: harmless, removed by lifecycle rule if configured */
  });
  return data as MediaRow;
}

/**
 * Privileged server-side upload for small files (≤ ~4 MB on Vercel), e.g.
 * from a Server Action or a generated asset. Bytes are sniffed before storing.
 */
export async function uploadFromServer(
  user: SessionUser | null,
  input: { category: MediaCategory; file: File; visibility?: MediaVisibility; altText?: string | null },
): Promise<MediaRow> {
  const { category, file } = input;
  assertCanUpload(user, category);
  const req: UploadRequest = { category, filename: file.name, mimeType: file.type, size: file.size, visibility: input.visibility, altText: input.altText };
  validateUpload(req);

  const bytes = new Uint8Array(await file.arrayBuffer());
  assertContentMatches(file.type, bytes.subarray(0, 64));

  const visibility = resolveVisibility(user, req);
  const { bucket, privateInSharedBucket } = r2.bucketFor(visibility);
  const objectKey = buildObjectKey({ category, filename: file.name, mimeType: file.type, privateInSharedBucket });
  await r2.putObject({ bucket, key: objectKey, body: bytes, contentType: file.type, cacheControl: visibility === "public" ? PUBLIC_CACHE : PRIVATE_CACHE });

  const { data, error } = await db()
    .from("media")
    .insert({
      category,
      visibility,
      bucket,
      object_key: objectKey,
      public_url: visibility === "public" ? r2.publicUrlFor(objectKey) : null,
      mime_type: file.type,
      size_bytes: file.size,
      original_filename: file.name.slice(0, 255),
      alt_text: input.altText ?? null,
      status: "ready",
      owner_id: user.id,
      metadata: { detected_type: sniffMimeType(bytes.subarray(0, 64)) },
    })
    .select("*")
    .single();
  if (error || !data) {
    await r2.deleteObject(bucket, objectKey);
    throw new StorageError("ফাইলের তথ্য সংরক্ষণ করা যায়নি।", 500, "db_error");
  }
  return data as MediaRow;
}

/** Soft-delete in DB → delete in R2 → hard-delete row. Foreign keys are set to NULL. */
export async function deleteMedia(user: SessionUser | null, mediaId: string): Promise<void> {
  const row = await getRow(mediaId);
  assertCanManage(user, row);
  await db().from("media").update({ status: "deleted" }).eq("id", row.id);
  await r2.deleteObject(row.bucket, row.object_key); // if this throws, the cleanup job retries
  await db().from("media").delete().eq("id", row.id);
}

/**
 * URL a given viewer may use: the permanent public URL for public files,
 * otherwise a short-lived signed URL after an access check.
 */
export async function getAccessUrl(user: SessionUser | null, mediaId: string, opts: { download?: boolean; expiresIn?: number } = {}): Promise<string> {
  const row = await getRow(mediaId);
  if (row.status !== "ready") throw new StorageError("ফাইল পাওয়া যায়নি।", 404, "not_found");

  if (row.visibility === "public" && row.public_url && !opts.download) return row.public_url;
  if (row.visibility === "authenticated" && !user) throw new StorageError("ডাউনলোডের জন্য লগইন প্রয়োজন।", 401, "unauthenticated");
  if (row.visibility === "private" && !(user && (isStaff(user) || row.owner_id === user.id))) {
    throw new StorageError("এই ফাইলে প্রবেশাধিকার নেই।", 403, "forbidden");
  }
  return r2.presignGet({
    bucket: row.bucket,
    key: row.object_key,
    expiresIn: opts.expiresIn ?? 300,
    contentDisposition: contentDisposition(row.original_filename, !opts.download),
  });
}

/** Metadata visible to the viewer (never includes bucket internals for private files). */
export async function getMedia(user: SessionUser | null, mediaId: string) {
  const row = await getRow(mediaId);
  const visible =
    row.status === "ready" &&
    (row.visibility === "public" || (row.visibility === "authenticated" && !!user) || (!!user && (isStaff(user) || row.owner_id === user.id)));
  if (!visible) throw new StorageError("ফাইল পাওয়া যায়নি।", 404, "not_found");
  return toPublicMedia(row);
}

export function toPublicMedia(row: MediaRow) {
  return {
    id: row.id,
    category: row.category,
    visibility: row.visibility,
    url: row.public_url ?? `/api/media/${row.id}/download`,
    mimeType: row.mime_type,
    size: row.size_bytes,
    filename: row.original_filename,
    altText: row.alt_text,
    createdAt: row.created_at,
  };
}

/** Scheduled job: drop uploads never completed and retry failed deletions. */
export async function cleanupStaleMedia(olderThanHours = 24): Promise<{ removed: number }> {
  const cutoff = new Date(Date.now() - olderThanHours * 3600_000).toISOString();
  const { data } = await db()
    .from("media")
    .select("*")
    .or(`and(status.eq.pending,created_at.lt.${cutoff}),status.eq.deleted`)
    .limit(500);
  let removed = 0;
  for (const row of (data ?? []) as MediaRow[]) {
    try {
      await discard(row);
      removed++;
    } catch {
      /* try again next run */
    }
  }
  return { removed };
}
