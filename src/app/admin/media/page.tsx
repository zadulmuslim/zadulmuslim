import type { Metadata } from "next";
import Link from "next/link";
import { FileAudio, FileText, FileVideo } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_RULES, MEDIA_CATEGORIES, roleAtLeast, isMediaCategory } from "@/lib/storage/categories";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { MediaUploader } from "@/components/admin/media-uploader";
import { MediaActions } from "@/components/admin/media-actions";
import { formatBnDate, formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "মিডিয়া" };
const PAGE_SIZE = 24;

export default async function AdminMedia({ searchParams }: { searchParams: Promise<{ category?: string; page?: string }> }) {
  const sp = await searchParams;
  const category = isMediaCategory(sp.category) ? sp.category : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const user = await getSessionUser();
  const uploadable = MEDIA_CATEGORIES.filter((c) => roleAtLeast(user?.role, CATEGORY_RULES[c].minRole));

  const supabase = await createClient();
  let query = supabase
    .from("media")
    .select("id, category, visibility, public_url, mime_type, size_bytes, original_filename, created_at", { count: "exact" })
    .eq("status", "ready")
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (category) query = query.eq("category", category);
  const { data, count } = await query;

  return (
    <>
      <PageHeader title="মিডিয়া লাইব্রেরি" description="সাইটে ব্যবহৃত ছবি ও ফাইলসমূহ এক জায়গায় দেখুন ও পরিচালনা করুন।" />
      <MediaUploader categories={uploadable} />

      <div className="my-5 flex flex-wrap gap-1.5">
        <Link href="/admin/media" className={cn("rounded-full border px-3 py-1 text-xs", !category ? "border-primary bg-primary text-white" : "bg-card hover:border-accent")}>সব</Link>
        {MEDIA_CATEGORIES.map((c) => (
          <Link key={c} href={`/admin/media?category=${c}`} className={cn("rounded-full border px-3 py-1 text-xs", category === c ? "border-primary bg-primary text-white" : "bg-card hover:border-accent")}>
            {CATEGORY_RULES[c].labelBn}
          </Link>
        ))}
      </div>

      {data?.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {data.map((m) => {
            const url = m.public_url ?? `/api/media/${m.id}/download?inline=1`;
            const Icon = m.mime_type.startsWith("audio/") ? FileAudio : m.mime_type.startsWith("video/") ? FileVideo : FileText;
            return (
              <li key={m.id} className="overflow-hidden rounded-xl border bg-card shadow-sm">
                <a href={url} target="_blank" rel="noreferrer" className="block aspect-video bg-secondary/50">
                  {m.mime_type.startsWith("image/") && m.public_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.public_url} alt="" loading="lazy" className="size-full object-cover" />
                  ) : (
                    <span className="grid size-full place-items-center"><Icon className="size-10 text-primary/60" /></span>
                  )}
                </a>
                <div className="flex items-start gap-2 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" title={m.original_filename}>{m.original_filename}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {CATEGORY_RULES[m.category as keyof typeof CATEGORY_RULES]?.labelBn ?? m.category} · {formatBytes(m.size_bytes)} · {formatBnDate(m.created_at)}
                      {m.visibility !== "public" && " · 🔒"}
                    </p>
                  </div>
                  <MediaActions id={m.id} url={url} />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-xl border bg-card px-5 py-12 text-center text-sm text-muted-foreground">কোনো ফাইল নেই।</p>
      )}
      <Pagination page={page} pageCount={Math.ceil((count ?? 0) / PAGE_SIZE)} makeHref={(p) => `/admin/media?${category ? `category=${category}&` : ""}page=${p}`} />
    </>
  );
}
