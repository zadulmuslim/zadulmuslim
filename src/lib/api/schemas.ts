import { z } from "zod";
import { MEDIA_CATEGORIES } from "@/lib/storage/categories";

export const uploadRequestSchema = z.object({
  category: z.enum(MEDIA_CATEGORIES as [string, ...string[]]),
  filename: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(3).max(100),
  size: z.number().int().positive(),
  visibility: z.enum(["public", "authenticated", "private"]).optional(),
  altText: z.string().max(300).nullish(),
});

export const replaceRequestSchema = uploadRequestSchema.pick({ filename: true, mimeType: true, size: true, altText: true });
