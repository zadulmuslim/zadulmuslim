"use client";
import { useRef, useState } from "react";
import { FileAudio, FileText, FileVideo, ImagePlus, Loader2, Upload, X } from "lucide-react";
import { uploadFile } from "@/lib/storage/client-upload";
import type { MediaCategory } from "@/lib/storage/categories";
import { toBnDigits } from "@/lib/utils";

export interface PickedMedia { id: string; url: string; name?: string | null; mime?: string | null }

/**
 * Uploads one file (image, PDF, audio or video) to storage and keeps its
 * media id in a hidden field. Images show a preview, audio a player.
 */
export function MediaPicker({ name, category, initial, kind, label }: { name: string; category: MediaCategory; initial?: PickedMedia | null; kind: "image" | "pdf" | "audio" | "video"; label: string }) {
  const [media, setMedia] = useState<PickedMedia | null>(initial ?? null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const accept = { image: "image/*", pdf: "application/pdf,application/epub+zip", audio: "audio/*", video: "video/mp4,video/webm" }[kind];
  const Icon = { image: ImagePlus, pdf: FileText, audio: FileAudio, video: FileVideo }[kind];

  async function pick(file: File | undefined) {
    if (!file) return;
    setError(null);
    setProgress(0);
    try {
      const m = await uploadFile(file, { category, onProgress: setProgress });
      setMedia({ id: m.id, url: m.url, name: file.name, mime: file.type });
    } catch (e) {
      setError(e instanceof Error ? e.message : "আপলোড সম্পন্ন হয়নি।");
    } finally {
      setProgress(null);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">{label}</p>
      <input type="hidden" name={name} value={media?.id ?? ""} />
      {media ? (
        <div className="overflow-hidden rounded-lg border bg-card">
          {kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media.url} alt="" className="aspect-video w-full object-cover" />
          ) : kind === "audio" ? (
            <audio src={media.url} controls preload="none" className="w-full p-2" />
          ) : (
            <a href={media.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 text-sm text-primary underline">
              <Icon className="size-5 shrink-0" /> <span className="truncate">{media.name ?? "ফাইল দেখুন"}</span>
            </a>
          )}
          <div className="flex justify-end gap-2 border-t p-2">
            <button type="button" onClick={() => input.current?.click()} className="rounded-full border px-3 py-1 text-xs font-medium hover:border-accent">পরিবর্তন</button>
            <button type="button" onClick={() => setMedia(null)} className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium text-destructive hover:border-destructive/40"><X className="size-3.5" /> সরান</button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={progress !== null}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-sm text-muted-foreground hover:border-accent hover:text-primary ${kind === "image" ? "aspect-video" : "py-6"}`}
        >
          {progress !== null ? <><Loader2 className="size-6 animate-spin" />{toBnDigits(progress)}%</> : <><Upload className="size-6" />ফাইল বেছে নিন</>}
        </button>
      )}
      <input ref={input} type="file" accept={accept} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
