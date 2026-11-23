"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Check, Minus, Plus, RotateCcw, RotateCw, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const OUTPUT = 512;
/** Keeps an angle within -180…180 so it always fits the fine-rotation slider. */
const norm = (deg: number) => ((((deg + 180) % 360) + 360) % 360) - 180;

/** Draws the cropped, rotated area onto a 512×512 canvas and returns a WebP file. */
async function renderCrop(src: string, area: Area, rotation: number, flip: boolean): Promise<File> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });
  const rad = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const bw = img.naturalWidth * cos + img.naturalHeight * sin;
  const bh = img.naturalWidth * sin + img.naturalHeight * cos;

  // Rotate the whole image onto a bounding canvas, then cut the crop area out.
  const full = document.createElement("canvas");
  full.width = Math.round(bw);
  full.height = Math.round(bh);
  const fctx = full.getContext("2d")!;
  fctx.translate(bw / 2, bh / 2);
  fctx.rotate(rad);
  if (flip) fctx.scale(-1, 1);
  fctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

  const out = document.createElement("canvas");
  out.width = OUTPUT;
  out.height = OUTPUT;
  const octx = out.getContext("2d")!;
  octx.imageSmoothingQuality = "high";
  octx.fillStyle = "#ffffff";
  octx.fillRect(0, 0, OUTPUT, OUTPUT);
  octx.drawImage(full, area.x, area.y, area.width, area.height, 0, 0, OUTPUT, OUTPUT);

  const blob = await new Promise<Blob | null>((r) => out.toBlob(r, "image/webp", 0.86));
  const final = blob ?? (await new Promise<Blob | null>((r) => out.toBlob(r, "image/jpeg", 0.88)));
  if (!final) throw new Error("encode failed");
  return new File([final], `avatar.${final.type === "image/webp" ? "webp" : "jpg"}`, { type: final.type });
}

/**
 * Full-screen photo editor: drag to position, zoom, rotate (90° steps or fine),
 * mirror, then save as a square profile photo.
 */
export function AvatarEditor({ file, onCancel, onSave }: { file: File; onCancel: () => void; onSave: (f: File) => void }) {
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flip, setFlip] = useState(false);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const probe = new Image();
    probe.onload = () => setSrc(url);
    probe.onerror = () => setError("এই ছবিটি খোলা যায়নি (যেমন HEIC)। অনুগ্রহ করে JPG বা PNG ছবি দিন।");
    probe.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onCancel]);

  const onComplete = useCallback((_: Area, px: Area) => setArea(px), []);

  async function save() {
    if (!src || !area) return;
    setBusy(true);
    setError(null);
    try {
      onSave(await renderCrop(src, area, rotation, flip));
    } catch {
      setError("ছবিটি প্রস্তুত করা যায়নি। অন্য একটি ছবি দিয়ে চেষ্টা করুন।");
      setBusy(false);
    }
  }

  const reset = () => {
    setZoom(1);
    setRotation(0);
    setFlip(false);
    setCrop({ x: 0, y: 0 });
  };
  const tool = "grid size-10 place-items-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

  return (
    <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label="প্রোফাইল ছবি সম্পাদনা" className="fixed inset-0 z-[80] flex flex-col bg-[#0a1b28] text-white outline-none">
      <div className="flex items-center justify-between px-4 py-3">
        <button type="button" onClick={onCancel} className={tool} aria-label="বাতিল"><X className="size-5" /></button>
        <p className="font-semibold">ছবি সম্পাদনা</p>
        <button type="button" onClick={reset} className={tool} aria-label="আগের অবস্থায় ফেরান" title="আগের অবস্থায় ফেরান"><Undo2 className="size-5" /></button>
      </div>

      <div className="relative min-h-0 flex-1">
        {src ? (
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="round"
            showGrid={false}
            minZoom={1}
            maxZoom={4}
            zoomSpeed={0.15}
            transform={`translate(${crop.x}px, ${crop.y}px) rotate(${rotation}deg) scale(${zoom}) scaleX(${flip ? -1 : 1})`}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onComplete}
            onMediaLoaded={() => setError(null)}
          />
        ) : null}
      </div>

      <div className="space-y-4 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <button type="button" className={tool} onClick={() => setZoom((z) => Math.max(1, +(z - 0.2).toFixed(2)))} aria-label="ছোট করুন"><Minus className="size-4" /></button>
          <label className="flex-1">
            <span className="sr-only">জুম</span>
            <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => setZoom(+e.target.value)} className="w-full accent-[#e0a43a]" />
          </label>
          <button type="button" className={tool} onClick={() => setZoom((z) => Math.min(4, +(z + 0.2).toFixed(2)))} aria-label="বড় করুন"><Plus className="size-4" /></button>
        </div>
        <div className="mx-auto flex max-w-md items-center gap-3">
          <button type="button" className={tool} onClick={() => setRotation((r) => norm(r - 90))} aria-label="বাঁয়ে ঘোরান" title="বাঁয়ে ঘোরান"><RotateCcw className="size-4" /></button>
          <label className="flex-1">
            <span className="sr-only">সূক্ষ্মভাবে ঘোরান</span>
            <input type="range" min={-180} max={180} step={1} value={rotation} onChange={(e) => setRotation(+e.target.value)} className="w-full accent-[#e0a43a]" />
          </label>
          <button type="button" className={tool} onClick={() => setRotation((r) => norm(r + 90))} aria-label="ডানে ঘোরান" title="ডানে ঘোরান"><RotateCw className="size-4" /></button>
          <button type="button" className={`${tool} text-xs font-semibold`} onClick={() => setFlip((f) => !f)} aria-pressed={flip} aria-label="উল্টে দিন (আয়না)" title="উল্টে দিন">⇋</button>
        </div>
        {error && <p className="text-center text-sm text-red-300">{error}</p>}
        <div className="mx-auto flex max-w-md gap-3">
          <Button type="button" variant="outline" className="flex-1 border-white/30 bg-transparent text-white hover:bg-white/10" onClick={onCancel}>বাতিল</Button>
          <Button type="button" className="flex-1 bg-accent text-brand-deep hover:bg-accent/90" onClick={save} disabled={busy || !area}>
            <Check />{busy ? "প্রস্তুত হচ্ছে…" : "ছবি সংরক্ষণ করুন"}
          </Button>
        </div>
      </div>
    </div>
  );
}
