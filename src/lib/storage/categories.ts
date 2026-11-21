/**
 * Upload categories → R2 prefix, allowed types, size limits and who may upload.
 * Shared by server code and (type-only) by client upload widgets.
 */

export type MediaVisibility = "public" | "authenticated" | "private";
export type UserRole = "member" | "editor" | "admin" | "super_admin";

export type MediaCategory =
  | "article-featured"
  | "article-inline"
  | "quran"
  | "hadith"
  | "book"
  | "lecture-thumbnail"
  | "lecture-video"
  | "audio"
  | "document"
  | "profile"
  | "site-asset";

const MB = 1024 * 1024;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"] as const;
const DOC_TYPES = ["application/pdf", "application/epub+zip"] as const;
const AUDIO_TYPES = ["audio/mpeg", "audio/mp4", "audio/aac", "audio/ogg", "audio/wav", "audio/webm"] as const;
const VIDEO_TYPES = ["video/mp4", "video/webm"] as const;

export interface CategoryRule {
  /** R2 object prefix, always ending in "/". */
  prefix: string;
  allowedMimeTypes: readonly string[];
  maxBytes: number;
  defaultVisibility: MediaVisibility;
  /** Minimum role allowed to upload into this category. */
  minRole: UserRole;
  labelBn: string;
}

export const CATEGORY_RULES: Record<MediaCategory, CategoryRule> = {
  "article-featured": { prefix: "articles/", allowedMimeTypes: IMAGE_TYPES, maxBytes: 5 * MB, defaultVisibility: "public", minRole: "editor", labelBn: "প্রবন্ধের প্রধান ছবি" },
  "article-inline": { prefix: "articles/inline/", allowedMimeTypes: IMAGE_TYPES, maxBytes: 5 * MB, defaultVisibility: "public", minRole: "editor", labelBn: "প্রবন্ধের ভেতরের ছবি" },
  quran: { prefix: "quran/", allowedMimeTypes: [...DOC_TYPES, ...IMAGE_TYPES, ...AUDIO_TYPES], maxBytes: 200 * MB, defaultVisibility: "public", minRole: "editor", labelBn: "কুরআন" },
  hadith: { prefix: "hadith/", allowedMimeTypes: [...DOC_TYPES, ...IMAGE_TYPES], maxBytes: 100 * MB, defaultVisibility: "public", minRole: "editor", labelBn: "হাদীস" },
  book: { prefix: "books/", allowedMimeTypes: [...DOC_TYPES, ...IMAGE_TYPES], maxBytes: 200 * MB, defaultVisibility: "public", minRole: "editor", labelBn: "বই" },
  "lecture-thumbnail": { prefix: "lectures/thumbnails/", allowedMimeTypes: IMAGE_TYPES, maxBytes: 5 * MB, defaultVisibility: "public", minRole: "editor", labelBn: "বয়ানের থাম্বনেইল" },
  "lecture-video": { prefix: "lectures/video/", allowedMimeTypes: VIDEO_TYPES, maxBytes: 2048 * MB, defaultVisibility: "public", minRole: "editor", labelBn: "বয়ানের ভিডিও" },
  audio: { prefix: "audio/", allowedMimeTypes: AUDIO_TYPES, maxBytes: 300 * MB, defaultVisibility: "public", minRole: "editor", labelBn: "অডিও" },
  document: { prefix: "documents/", allowedMimeTypes: DOC_TYPES, maxBytes: 50 * MB, defaultVisibility: "private", minRole: "editor", labelBn: "ডকুমেন্ট" },
  profile: { prefix: "profiles/", allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"], maxBytes: 2 * MB, defaultVisibility: "public", minRole: "member", labelBn: "প্রোফাইল ছবি" },
  "site-asset": { prefix: "site-assets/", allowedMimeTypes: IMAGE_TYPES, maxBytes: 10 * MB, defaultVisibility: "public", minRole: "admin", labelBn: "সাইট অ্যাসেট" },
};

export const MEDIA_CATEGORIES = Object.keys(CATEGORY_RULES) as MediaCategory[];

/** Canonical file extension for each MIME type (used to build object keys). */
export const MIME_EXTENSIONS: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/avif": ["avif"],
  "image/gif": ["gif"],
  "application/pdf": ["pdf"],
  "application/epub+zip": ["epub"],
  "audio/mpeg": ["mp3"],
  "audio/mp4": ["m4a", "mp4"],
  "audio/aac": ["aac"],
  "audio/ogg": ["ogg", "oga", "opus"],
  "audio/wav": ["wav"],
  "audio/webm": ["weba", "webm"],
  "video/mp4": ["mp4", "m4v"],
  "video/webm": ["webm"],
};

const ROLE_RANK: Record<UserRole, number> = { member: 1, editor: 2, admin: 3, super_admin: 4 };

export function roleAtLeast(role: UserRole | null | undefined, min: UserRole): boolean {
  return !!role && ROLE_RANK[role] >= ROLE_RANK[min];
}

export function isMediaCategory(value: unknown): value is MediaCategory {
  return typeof value === "string" && value in CATEGORY_RULES;
}

export const ROLE_LABEL_BN: Record<UserRole, string> = {
  member: "সদস্য",
  editor: "সম্পাদক",
  admin: "অ্যাডমিন",
  super_admin: "সুপার অ্যাডমিন",
};
