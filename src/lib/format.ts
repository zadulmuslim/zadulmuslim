import { toBnDigits } from "@/lib/utils";

const BN_MONTHS = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];

/** "৯ অক্টোবর ২০২৬" in Asia/Dhaka. */
export function formatBnDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(new Date(iso).toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
  return `${toBnDigits(d.getDate())} ${BN_MONTHS[d.getMonth()]} ${toBnDigits(d.getFullYear())}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${toBnDigits(bytes)} B`;
  if (bytes < 1024 * 1024) return `${toBnDigits((bytes / 1024).toFixed(0))} KB`;
  return `${toBnDigits((bytes / (1024 * 1024)).toFixed(1))} MB`;
}

/** Unicode-friendly slug: keeps Bengali letters, joins words with "-". */
export function slugify(input: string): string {
  return input
    .normalize("NFC")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}
