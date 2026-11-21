"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { uploadFile } from "@/lib/storage/client-upload";
import { CATEGORY_RULES, type MediaCategory } from "@/lib/storage/categories";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";

type Item = { name: string; progress: number; error?: string; done?: boolean };

export function MediaUploader({ categories }: { categories: MediaCategory[] }) {
  const router = useRouter();
  const [category, setCategory] = useState<MediaCategory>(categories[0] ?? "document");
  const [items, setItems] = useState<Item[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const rule = CATEGORY_RULES[category];
  const busy = items.some((i) => !i.done && !i.error);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files);
    setItems(list.map((f) => ({ name: f.name, progress: 0 })));
    const update = (idx: number, patch: Partial<Item>) => setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
    for (const [idx, file] of list.entries()) {
      try {
        await uploadFile(file, { category, onProgress: (p) => update(idx, { progress: p }) });
        update(idx, { done: true, progress: 100 });
      } catch (e) {
        update(idx, { error: e instanceof Error ? e.message : "ব্যর্থ" });
      }
    }
    if (input.current) input.current.value = "";
    router.refresh();
  }

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <label htmlFor="upload-category" className="mb-1.5 block text-sm font-medium">কোন বিভাগে আপলোড করবেন</label>
          <NativeSelect id="upload-category" value={category} onChange={(e) => setCategory(e.target.value as MediaCategory)}>
            {categories.map((c) => <option key={c} value={c}>{CATEGORY_RULES[c].labelBn}</option>)}
          </NativeSelect>
        </div>
        <Button type="button" onClick={() => input.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <Upload />}ফাইল বেছে নিন
        </Button>
        <input ref={input} type="file" multiple accept={rule.allowedMimeTypes.join(",")} className="hidden" onChange={(e) => onFiles(e.target.files)} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        অনুমোদিত: {rule.allowedMimeTypes.map((m) => m.split("/")[1]).join(", ")} · সর্বোচ্চ {Math.round(rule.maxBytes / 1048576)} MB ·{" "}
        {rule.defaultVisibility === "public" ? "সবার জন্য উন্মুক্ত" : "সংরক্ষিত (শুধু অনুমতিপ্রাপ্তরা)"}
      </p>
      {items.length > 0 && (
        <ul className="mt-3 space-y-1.5 text-xs">
          {items.map((it, i) => (
            <li key={i} className="flex items-center gap-3">
              <span className="min-w-0 flex-1 truncate">{it.name}</span>
              {it.error ? (
                <span className="text-destructive">{it.error}</span>
              ) : (
                <span className="flex w-32 items-center gap-2">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                    <span className="block h-full bg-primary transition-all" style={{ width: `${it.progress}%` }} />
                  </span>
                  {it.done ? "✓" : `${it.progress}%`}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
