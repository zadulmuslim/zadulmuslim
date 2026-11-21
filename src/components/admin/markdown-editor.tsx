"use client";
import { useRef, useState } from "react";
import { Bold, Eye, Heading2, ImagePlus, Italic, List, Loader2, Pencil, Quote } from "lucide-react";
import { Markdown } from "@/components/content/markdown";
import { uploadFile } from "@/lib/storage/client-upload";
import type { MediaCategory } from "@/lib/storage/categories";
import { cn } from "@/lib/utils";

/**
 * Markdown textarea with a small toolbar, live preview and inline image
 * upload to Cloudflare R2. Uploaded media ids are reported via onMediaUploaded
 * so the parent form can link them (e.g. article_media).
 */
export function MarkdownEditor({
  name,
  defaultValue = "",
  rows = 14,
  imageCategory,
  onMediaUploaded,
  placeholder,
  id,
}: {
  name: string;
  defaultValue?: string;
  rows?: number;
  imageCategory?: MediaCategory;
  onMediaUploaded?: (mediaId: string) => void;
  placeholder?: string;
  id?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ta = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function insert(before: string, after = "", placeholderText = "") {
    const el = ta.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const selected = value.slice(s, e) || placeholderText;
    const next = value.slice(0, s) + before + selected + after + value.slice(e);
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + selected.length);
    });
  }

  async function onImage(file: File | undefined) {
    if (!file || !imageCategory) return;
    setError(null);
    setUploading(0);
    try {
      const media = await uploadFile(file, { category: imageCategory, onProgress: setUploading });
      onMediaUploaded?.(media.id);
      const alt = file.name.replace(/\.[^.]+$/, "");
      insert(`\n![${alt}](${media.url})\n`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ছবি আপলোড ব্যর্থ হয়েছে।");
    } finally {
      setUploading(null);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  const tool = "grid size-8 place-items-center rounded-md text-foreground/70 hover:bg-secondary hover:text-primary disabled:opacity-40";

  return (
    <div className="overflow-hidden rounded-lg border border-input bg-card focus-within:ring-2 focus-within:ring-ring">
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-secondary/40 px-2 py-1">
        <button type="button" className={tool} onClick={() => insert("**", "**", "গাঢ় লেখা")} disabled={preview} aria-label="গাঢ়"><Bold className="size-4" /></button>
        <button type="button" className={tool} onClick={() => insert("*", "*", "বাঁকা লেখা")} disabled={preview} aria-label="বাঁকা"><Italic className="size-4" /></button>
        <button type="button" className={tool} onClick={() => insert("\n## ", "\n", "উপশিরোনাম")} disabled={preview} aria-label="উপশিরোনাম"><Heading2 className="size-4" /></button>
        <button type="button" className={tool} onClick={() => insert("\n- ", "", "তালিকা")} disabled={preview} aria-label="তালিকা"><List className="size-4" /></button>
        <button type="button" className={tool} onClick={() => insert("\n> ", "\n", "উদ্ধৃতি / দলীল")} disabled={preview} aria-label="উদ্ধৃতি"><Quote className="size-4" /></button>
        {imageCategory && (
          <>
            <button type="button" className={tool} onClick={() => fileInput.current?.click()} disabled={preview || uploading !== null} aria-label="ছবি যোগ করুন">
              {uploading !== null ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            </button>
            <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => onImage(e.target.files?.[0])} />
          </>
        )}
        {uploading !== null && <span className="text-xs text-muted-foreground">{uploading}%</span>}
        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-primary hover:bg-secondary"
        >
          {preview ? <><Pencil className="size-3.5" />সম্পাদনা</> : <><Eye className="size-3.5" />প্রিভিউ</>}
        </button>
      </div>
      <textarea
        ref={ta}
        id={id}
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={cn("block w-full resize-y bg-transparent px-4 py-3 text-sm leading-relaxed focus:outline-none", preview && "hidden")}
      />
      {preview && (
        <div className="min-h-40 px-5 py-4">
          {value.trim() ? <Markdown>{value}</Markdown> : <p className="text-sm text-muted-foreground">প্রিভিউ করার মতো কিছু লেখা হয়নি।</p>}
        </div>
      )}
      {error && <p className="border-t px-4 py-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
