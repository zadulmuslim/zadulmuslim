"use client";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Info, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Branded replacements for window.confirm / alert / prompt.
 *   const dialog = useDialog();
 *   if (await dialog.confirm({ title, message, tone: "danger" })) …
 * Promise-based, keyboard-accessible (focus trap, Esc = cancel, Enter = confirm).
 */

type Tone = "danger" | "default";
interface BaseOpts { title: string; message?: React.ReactNode; tone?: Tone }
export interface ConfirmOpts extends BaseOpts { confirmText?: string; cancelText?: string }
export interface AlertOpts extends BaseOpts { okText?: string }
export interface PromptOpts extends BaseOpts { label?: string; defaultValue?: string; placeholder?: string; confirmText?: string; cancelText?: string; inputType?: string; dir?: "ltr" | "rtl" }

type Request =
  | { kind: "confirm"; opts: ConfirmOpts; resolve: (v: boolean) => void }
  | { kind: "alert"; opts: AlertOpts; resolve: (v: void) => void }
  | { kind: "prompt"; opts: PromptOpts; resolve: (v: string | null) => void };

interface DialogApi {
  confirm: (o: ConfirmOpts) => Promise<boolean>;
  alert: (o: AlertOpts) => Promise<void>;
  prompt: (o: PromptOpts) => Promise<string | null>;
}

const Ctx = createContext<DialogApi | null>(null);

export function useDialog(): DialogApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDialog must be used inside <DialogProvider>");
  return ctx;
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<Request[]>([]);
  const push = useCallback((r: Request) => setQueue((q) => [...q, r]), []);
  const api = useRef<DialogApi>({
    confirm: (opts) => new Promise((resolve) => push({ kind: "confirm", opts, resolve })),
    alert: (opts) => new Promise((resolve) => push({ kind: "alert", opts, resolve })),
    prompt: (opts) => new Promise((resolve) => push({ kind: "prompt", opts, resolve })),
  }).current;

  const current = queue[0];
  const close = useCallback(
    (value: unknown) => {
      if (!current) return;
      (current.resolve as (v: unknown) => void)(value);
      setQueue((q) => q.slice(1));
    },
    [current],
  );

  return (
    <Ctx.Provider value={api}>
      {children}
      {current && <DialogView key={queue.length + current.opts.title} req={current} onClose={close} />}
    </Ctx.Provider>
  );
}

function DialogView({ req, onClose }: { req: Request; onClose: (v: unknown) => void }) {
  const titleId = useId();
  const descId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const confirmBtn = useRef<HTMLButtonElement>(null);
  const [value, setValue] = useState(req.kind === "prompt" ? (req.opts.defaultValue ?? "") : "");
  const [shown, setShown] = useState(false);
  const tone = req.opts.tone ?? "default";

  const cancel = useCallback(() => onClose(req.kind === "confirm" ? false : req.kind === "prompt" ? null : undefined), [onClose, req.kind]);
  const accept = useCallback(() => onClose(req.kind === "confirm" ? true : req.kind === "prompt" ? value : undefined), [onClose, req.kind, value]);

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => setShown(true));
    // Danger dialogs focus "Cancel" first, so Enter never deletes by accident.
    setTimeout(() => {
      if (req.kind === "prompt") input.current?.select();
      else if (tone === "danger") panel.current?.querySelector<HTMLButtonElement>("[data-cancel]")?.focus();
      else confirmBtn.current?.focus();
    }, 20);
    return () => {
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [req.kind, tone]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    } else if (e.key === "Tab") {
      const els = panel.current?.querySelectorAll<HTMLElement>("button, input");
      if (!els?.length) return;
      const first = els[0]!;
      const last = els[els.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  const Icon = req.kind === "prompt" ? Link2 : tone === "danger" ? AlertTriangle : Info;
  const confirmLabel =
    req.kind === "alert" ? (req.opts.okText ?? "ঠিক আছে") : (req.opts.confirmText ?? (tone === "danger" ? "হ্যাঁ, মুছে ফেলুন" : "নিশ্চিত করুন"));
  const cancelLabel = req.kind === "alert" ? null : (req.opts.cancelText ?? "বাতিল");

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-3 sm:items-center sm:p-6" onKeyDown={onKeyDown}>
      <div className={cn("absolute inset-0 bg-[#0b1f14]/55 backdrop-blur-[2px] transition-opacity duration-200", shown ? "opacity-100" : "opacity-0")} onClick={cancel} aria-hidden />
      <div
        ref={panel}
        role={req.kind === "alert" || tone === "danger" ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={req.opts.message ? descId : undefined}
        className={cn(
          "relative w-full max-w-md overflow-hidden rounded-2xl border bg-card shadow-2xl transition-all duration-200 motion-reduce:transition-none",
          shown ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0",
        )}
      >
        <div className={cn("h-1.5", tone === "danger" ? "bg-destructive" : "bg-accent")} />
        <form
          className="p-5 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            accept();
          }}
        >
          <div className="flex gap-4">
            <span className={cn("grid size-11 shrink-0 place-items-center rounded-full", tone === "danger" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
              <Icon className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <h2 id={titleId} className="text-lg font-bold leading-snug">{req.opts.title}</h2>
              {req.opts.message && <div id={descId} className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{req.opts.message}</div>}
              {req.kind === "prompt" && (
                <label className="mt-4 block text-sm">
                  {req.opts.label && <span className="mb-1.5 block font-medium">{req.opts.label}</span>}
                  <input
                    ref={input}
                    type={req.opts.inputType ?? "text"}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={req.opts.placeholder}
                    dir={req.opts.dir}
                    className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </label>
              )}
            </div>
          </div>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {cancelLabel && (
              <button type="button" data-cancel onClick={cancel} className="h-11 rounded-full border bg-card px-5 text-sm font-semibold hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {cancelLabel}
              </button>
            )}
            <button
              ref={confirmBtn}
              type="submit"
              className={cn(
                "h-11 rounded-full px-5 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                tone === "danger" ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90",
              )}
            >
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
