import "server-only";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Env } from "@/lib/env";
import type { MediaVisibility } from "./categories";

/**
 * Low-level Cloudflare R2 adapter (S3-compatible API).
 * Only this file talks to R2 directly; everything else goes through
 * `media-service.ts`. Credentials never leave the server.
 */

let client: S3Client | null = null;

function r2(): S3Client {
  if (client) return client;
  const env = r2Env();
  client = new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
    // R2 does not support the SDK's default CRC32 checksums on presigned PUTs.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return client;
}

/** Which bucket holds an object of the given visibility. */
export function bucketFor(visibility: MediaVisibility): { bucket: string; privateInSharedBucket: boolean } {
  const env = r2Env();
  if (visibility === "public") return { bucket: env.R2_BUCKET_NAME, privateInSharedBucket: false };
  if (env.R2_PRIVATE_BUCKET_NAME) return { bucket: env.R2_PRIVATE_BUCKET_NAME, privateInSharedBucket: false };
  return { bucket: env.R2_BUCKET_NAME, privateInSharedBucket: true };
}

/** Permanent URL on the public custom domain. Only valid for public objects. */
export function publicUrlFor(key: string): string {
  const base = r2Env().R2_PUBLIC_URL;
  return `${base}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export async function putObject(params: {
  bucket: string;
  key: string;
  body: Uint8Array;
  contentType: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
}): Promise<void> {
  await r2().send(
    new PutObjectCommand({
      Bucket: params.bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      ContentLength: params.body.byteLength,
      CacheControl: params.cacheControl,
      Metadata: params.metadata,
    }),
  );
}

/**
 * Presigned PUT so the browser uploads straight to R2 (avoids Vercel's
 * ~4.5 MB request-body limit). Content-Type and Content-Length are part of
 * the signature, so the client cannot swap the type or exceed the size.
 */
export async function presignPut(params: {
  bucket: string;
  key: string;
  contentType: string;
  contentLength: number;
  cacheControl?: string;
  expiresIn?: number;
}): Promise<{ url: string; headers: Record<string, string>; expiresIn: number }> {
  const expiresIn = params.expiresIn ?? 600;
  const url = await getSignedUrl(
    r2(),
    new PutObjectCommand({
      Bucket: params.bucket,
      Key: params.key,
      ContentType: params.contentType,
      ContentLength: params.contentLength,
      CacheControl: params.cacheControl,
    }),
    { expiresIn, signableHeaders: new Set(["content-type", "content-length"]) },
  );
  const headers: Record<string, string> = { "Content-Type": params.contentType };
  if (params.cacheControl) headers["Cache-Control"] = params.cacheControl;
  return { url, headers, expiresIn };
}

/** Short-lived signed GET for private / restricted downloads. */
export async function presignGet(params: {
  bucket: string;
  key: string;
  expiresIn?: number;
  contentDisposition?: string;
}): Promise<string> {
  return getSignedUrl(
    r2(),
    new GetObjectCommand({
      Bucket: params.bucket,
      Key: params.key,
      ResponseContentDisposition: params.contentDisposition,
    }),
    { expiresIn: params.expiresIn ?? 300 },
  );
}

export async function headObject(bucket: string, key: string): Promise<{ size: number; contentType: string | undefined } | null> {
  try {
    const res = await r2().send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return { size: res.ContentLength ?? 0, contentType: res.ContentType };
  } catch (err) {
    if (err instanceof S3ServiceException && (err.$metadata.httpStatusCode === 404 || err.name === "NotFound")) return null;
    throw err;
  }
}

/** First `bytes` bytes of an object (for magic-byte verification). */
export async function readObjectHead(bucket: string, key: string, bytes = 64): Promise<Uint8Array> {
  const res = await r2().send(new GetObjectCommand({ Bucket: bucket, Key: key, Range: `bytes=0-${bytes - 1}` }));
  return res.Body ? await res.Body.transformToByteArray() : new Uint8Array();
}

export async function deleteObject(bucket: string, key: string): Promise<void> {
  // S3 semantics: deleting a missing key succeeds, so this is idempotent.
  await r2().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
