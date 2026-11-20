import { CATEGORY_RULES, MIME_EXTENSIONS, type MediaCategory } from "./categories";

export class StorageError extends Error {
  constructor(
    message: string,
    public readonly status: number = 400,
    public readonly code: string = "invalid_upload",
  ) {
    super(message);
    this.name = "StorageError";
  }
}

export interface UploadDescriptor {
  category: MediaCategory;
  filename: string;
  mimeType: string;
  size: number;
}

export function fileExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot + 1).toLowerCase();
}

/** Declared-metadata checks: type allowed for category, extension matches type, size in range. */
export function validateUpload({ category, filename, mimeType, size }: UploadDescriptor): void {
  const rule = CATEGORY_RULES[category];
  const mime = mimeType.toLowerCase().split(";")[0]!.trim();

  if (!rule.allowedMimeTypes.includes(mime)) {
    throw new StorageError(`"${mime}" ধরনের ফাইল এই বিভাগে অনুমোদিত নয়।`, 415, "unsupported_type");
  }
  const ext = fileExtension(filename);
  if (!ext || !(MIME_EXTENSIONS[mime] ?? []).includes(ext)) {
    throw new StorageError("ফাইলের এক্সটেনশন ও ধরন মিলছে না।", 415, "extension_mismatch");
  }
  if (!Number.isSafeInteger(size) || size <= 0) {
    throw new StorageError("ফাইলের আকার সঠিক নয়।", 400, "invalid_size");
  }
  if (size > rule.maxBytes) {
    const limitMb = Math.round(rule.maxBytes / (1024 * 1024));
    throw new StorageError(`ফাইল অনেক বড়। সর্বোচ্চ ${limitMb} MB অনুমোদিত।`, 413, "too_large");
  }
}

const startsWith = (b: Uint8Array, sig: number[], offset = 0) =>
  sig.every((byte, i) => b[offset + i] === byte);
const ascii = (b: Uint8Array, from: number, to: number) =>
  String.fromCharCode(...b.subarray(from, to));

/**
 * Detect the real file type from its first bytes so a renamed file
 * (e.g. an .html saved as .jpg) is rejected. Returns null if unknown.
 */
export function sniffMimeType(head: Uint8Array): string | null {
  if (head.length < 12) return null;
  if (startsWith(head, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (ascii(head, 0, 4) === "GIF8") return "image/gif";
  if (ascii(head, 0, 4) === "RIFF" && ascii(head, 8, 12) === "WEBP") return "image/webp";
  if (ascii(head, 0, 4) === "RIFF" && ascii(head, 8, 12) === "WAVE") return "audio/wav";
  if (ascii(head, 0, 5) === "%PDF-") return "application/pdf";
  if (startsWith(head, [0x50, 0x4b, 0x03, 0x04])) return "application/zip"; // epub container
  if (ascii(head, 0, 4) === "OggS") return "audio/ogg";
  if (ascii(head, 0, 3) === "ID3" || (head[0] === 0xff && ((head[1] ?? 0) & 0xe0) === 0xe0)) return "audio/mpeg";
  if (startsWith(head, [0x1a, 0x45, 0xdf, 0xa3])) return "video/webm";
  if (ascii(head, 4, 8) === "ftyp") {
    const brand = ascii(head, 8, 12);
    if (brand === "avif" || brand === "avis") return "image/avif";
    if (brand.startsWith("M4A")) return "audio/mp4";
    return "video/mp4";
  }
  return null;
}

/** Families that may legitimately share a container signature. */
const COMPATIBLE: Record<string, string[]> = {
  "application/epub+zip": ["application/zip"],
  "audio/mp4": ["video/mp4", "audio/mp4"],
  "video/mp4": ["video/mp4", "audio/mp4"],
  "audio/webm": ["video/webm"],
  "audio/aac": ["audio/mpeg"], // ADTS frames share the 0xFFF sync word
};

export function assertContentMatches(declaredMime: string, head: Uint8Array): void {
  const sniffed = sniffMimeType(head);
  const declared = declaredMime.toLowerCase();
  const ok = sniffed !== null && (sniffed === declared || (COMPATIBLE[declared] ?? []).includes(sniffed));
  if (!ok) {
    throw new StorageError("ফাইলের ভেতরের বিষয়বস্তু ঘোষিত ধরনের সাথে মিলছে না।", 415, "content_mismatch");
  }
}
