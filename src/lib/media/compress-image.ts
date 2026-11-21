"use client";
import type { MediaCategory } from "@/lib/storage/categories";

/**
 * WhatsApp-style image compression in the browser, before upload:
 *  - fixes phone-camera rotation (EXIF orientation)
 *  - resizes to a sensible maximum edge for where the image is used
 *  - re-encodes as WebP (JPEG fallback on browsers without WebP encoding)
 *  - strips metadata such as GPS location (privacy)
 *  - steps quality/size down until it fits the category's limit
 * A 6–12 MB phone photo typically ends up at 200–600 KB with no visible loss.
 * GIFs (may be animated) and non-images are returned untouched.
 */

interface Preset {
  /** Longest edge in pixels. */
  maxEdge: number;
  /** Target ceiling in bytes for the compressed file. */
  maxBytes: number;
  /** Starting quality (0–1). */
  quality: number;
}

const KB = 1024;
const MB = 1024 * KB;

const PRESETS: Partial<Record<MediaCategory, Preset>> = {
  "article-featured": { maxEdge: 1920, maxBytes: 900 * KB, quality: 0.82 },
  "article-inline": { maxEdge: 1600, maxBytes: 700 * KB, quality: 0.8 },
  "lecture-thumbnail": { maxEdge: 1280, maxBytes: 500 * KB, quality: 0.8 },
  profile: { maxEdge: 512, maxBytes: 150 * KB, quality: 0.82 },
  "site-asset": { maxEdge: 2560, maxBytes: 2 * MB, quality: 0.85 },
  quran: { maxEdge: 2400, maxBytes: 2 * MB, quality: 0.85 },
  hadith: { maxEdge: 2400, maxBytes: 2 * MB, quality: 0.85 },
  book: { maxEdge: 1600, maxBytes: 800 * KB, quality: 0.82 },
};

/** Originals up to this size are accepted, because they are shrunk before upload. */
export const MAX_ORIGINAL_IMAGE_BYTES = 50 * MB;

export function isCompressibleImage(file: File): boolean {
  return file.type.startsWith("image/") && !/gif|svg/.test(file.type);
}

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // Fallback (e.g. HEIC on Safari, which <img> can decode).
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = "async";
      img.src = url;
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function hasTransparency(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
  // Sample a grid rather than every pixel (fast on large images).
  const step = Math.max(1, Math.floor(Math.min(w, h) / 64));
  const { data } = ctx.getImageData(0, 0, w, h);
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (data[(y * w + x) * 4 + 3]! < 250) return true;
    }
  }
  return false;
}

export interface CompressResult {
  file: File;
  originalBytes: number;
  compressed: boolean;
}

export async function compressImage(file: File, category: MediaCategory): Promise<CompressResult> {
  const preset = PRESETS[category];
  if (!preset || !isCompressibleImage(file)) return { file, originalBytes: file.size, compressed: false };

  const source = await decode(file);
  const srcW = "naturalWidth" in source ? source.naturalWidth : source.width;
  const srcH = "naturalHeight" in source ? source.naturalHeight : source.height;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: false });
  if (!ctx) return { file, originalBytes: file.size, compressed: false };

  let scale = Math.min(1, preset.maxEdge / Math.max(srcW, srcH));
  let quality = preset.quality;
  let best: Blob | null = null;
  let outType = "image/webp";

  for (let attempt = 0; attempt < 8; attempt++) {
    const w = Math.max(1, Math.round(srcW * scale));
    const h = Math.max(1, Math.round(srcH * scale));
    canvas.width = w;
    canvas.height = h;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(source, 0, 0, w, h);

    let blob = await toBlob(canvas, "image/webp", quality);
    if (!blob || blob.type !== "image/webp") {
      // No WebP encoder (older Safari): JPEG, unless the image needs transparency.
      const transparent = file.type === "image/png" && hasTransparency(ctx, w, h);
      outType = transparent ? "image/png" : "image/jpeg";
      blob = await toBlob(canvas, outType, quality);
    } else {
      outType = "image/webp";
    }
    if (!blob) break;
    best = blob;
    if (blob.size <= preset.maxBytes) break;
    // Too big: lower quality first, then dimensions.
    if (quality > 0.6) quality = Math.round((quality - 0.08) * 100) / 100;
    else scale *= 0.85;
  }

  if ("close" in source) source.close();
  if (!best) return { file, originalBytes: file.size, compressed: false };

  // Keep the original if it is already small, fits, and needs no resizing/rotation fix.
  const originalFine =
    file.size <= best.size && file.size <= preset.maxBytes && Math.max(srcW, srcH) <= preset.maxEdge && /jpeg|png|webp/.test(file.type);
  if (originalFine) return { file, originalBytes: file.size, compressed: false };

  const ext = outType === "image/webp" ? "webp" : outType === "image/png" ? "png" : "jpg";
  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  return {
    file: new File([best], `${base}.${ext}`, { type: outType, lastModified: Date.now() }),
    originalBytes: file.size,
    compressed: true,
  };
}

/** `accept` attribute for a file input: any image when the category takes images (HEIC included). */
export function acceptFor(allowedMimeTypes: readonly string[]): string {
  const images = allowedMimeTypes.some((m) => m.startsWith("image/"));
  const others = allowedMimeTypes.filter((m) => !m.startsWith("image/"));
  return [...(images ? ["image/*"] : []), ...others].join(",");
}
