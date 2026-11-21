"use client";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { uploadFile } from "@/lib/storage/client-upload";
import type { MediaCategory } from "@/lib/storage/categories";

/** Uploads one image to R2 and keeps its media id in a hidden form field. */
export function ImagePicker({ name, category, initial }: { name: string; category: MediaCategory; initial?: { id: string; url: string } | null }) {
  const [media, setMedia] = useState(initial ?? null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    setError(null);
    setProgress(0);
    try {
      const m = await uploadFile(file, { category, onProgress: setProgress });
      setMedia({ id: m.id, url: m.url });
    } catch (e) {
      setError(e instanceof Error ? e.message : "আপলোড ব্যর্থ হয়েছে।");
    } finally {
      setProgress(null);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={media?.id ?? ""} />
      {media ? (
        <div className="relative overflow-hidden rounded-lg border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={media.url} alt="" className="aspect-video w-full object-cover" />
          <button type="button" onClick={() => setMedia(null)} className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80" aria-label="ছবি সরান">
            <X className="size-4" />
          </button>
          <button type="button" onClick={() => input.current?.click()} className="absolute bottom-2 right-2 rounded-full bg-white/90 px-3 py-1 text-xs font-medium hover:bg-white">
            পরিবর্তন
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={progress !== null}
          className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-sm text-muted-foreground hover:border-accent hover:text-primary"
        >
          {progress !== null ? <><Loader2 className="size-6 animate-spin" />{progress}%</> : <><ImagePlus className="size-6" />ছবি বেছে নিন</>}
        </button>
      )}
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
