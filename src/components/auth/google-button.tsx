"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { signInWithGoogle, signInWithGoogleIdToken } from "@/app/actions/auth";

/* Minimal typings for Google Identity Services. */
interface GsiButtonOptions {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number;
  locale?: string;
}
interface GsiId {
  initialize(o: { client_id: string; callback: (r: { credential?: string }) => void; nonce?: string; ux_mode?: "popup"; use_fedcm_for_button?: boolean; itp_support?: boolean; context?: "signin" | "signup" | "use" }): void;
  renderButton(el: HTMLElement, o: GsiButtonOptions): void;
}
declare global {
  interface Window { google?: { accounts?: { id?: GsiId } } }
}

const GSI_SRC = "https://accounts.google.com/gsi/client";
let gsiPromise: Promise<GsiId> | null = null;
function loadGsi(): Promise<GsiId> {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  gsiPromise ??= new Promise<GsiId>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = GSI_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => (window.google?.accounts?.id ? resolve(window.google.accounts.id) : reject(new Error("gsi")));
    s.onerror = () => { gsiPromise = null; reject(new Error("gsi")); };
    document.head.appendChild(s);
  });
  return gsiPromise;
}

async function makeNonce(): Promise<{ raw: string; hashed: string }> {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const raw = btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, "");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hashed = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return { raw, hashed };
}

/** Fallback when Google's script can't load: the redirect flow through Supabase. */
function RedirectButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-11 w-full items-center justify-center gap-3 rounded-full border bg-white px-4 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary/40 hover:bg-muted/40 disabled:opacity-60"
    >
      {pending && <span className="size-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" aria-hidden />}
      {pending ? "Google-এ নেওয়া হচ্ছে…" : label}
    </button>
  );
}

/**
 * Google's own "Sign in with Google" button (popup, shows zadulmuslim.org),
 * followed by an "অথবা" divider before the email form.
 */
export function GoogleSignIn({
  next,
  clientId,
  mode = "signin",
  label = "Google দিয়ে চালিয়ে যান",
}: { next?: string; clientId: string | null; mode?: "signin" | "signup"; label?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "fallback" | "working">(clientId ? "loading" : "fallback");
  const [error, setError] = useState<string | null>(null);
  const nonceRef = useRef<{ raw: string; hashed: string } | null>(null);

  const onCredential = useCallback(async (r: { credential?: string }) => {
    const nonce = nonceRef.current;
    if (!r.credential || !nonce) return;
    setError(null);
    setState("working");
    const res = await signInWithGoogleIdToken({ credential: r.credential, nonce: nonce.raw, next });
    if (res.ok) {
      window.location.replace(res.redirectTo);
      return;
    }
    setError(res.message);
    setState("ready");
  }, [next]);

  useEffect(() => {
    if (!clientId) return;
    // Google only allows origins registered for the client (not Vercel preview URLs).
    const host = window.location.hostname;
    if (!(host === "zadulmuslim.org" || host.endsWith(".zadulmuslim.org") || host === "localhost")) {
      setState("fallback");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [gsi, nonce] = await Promise.all([loadGsi(), makeNonce()]);
        if (cancelled || !box.current) return;
        nonceRef.current = nonce;
        gsi.initialize({
          client_id: clientId,
          callback: (r) => void onCredential(r),
          nonce: nonce.hashed,
          ux_mode: "popup",
          use_fedcm_for_button: true,
          itp_support: true,
          context: mode === "signup" ? "signup" : "signin",
        });
        const width = Math.min(400, Math.max(220, Math.floor(box.current.getBoundingClientRect().width)));
        gsi.renderButton(box.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          text: mode === "signup" ? "signup_with" : "continue_with",
          logo_alignment: "center",
          width,
          locale: "bn",
        });
        setState("ready");
      } catch {
        if (!cancelled) setState("fallback");
      }
    })();
    return () => { cancelled = true; };
  }, [clientId, mode, onCredential]);

  return (
    <div className="mb-5">
      {state === "fallback" ? (
        <form action={signInWithGoogle}>
          {next && <input type="hidden" name="next" value={next} />}
          <RedirectButton label={label} />
        </form>
      ) : (
        <div className="relative flex min-h-11 justify-center">
          {/* Google draws its button here. */}
          <div ref={box} className={state === "working" ? "pointer-events-none w-full opacity-40" : "flex w-full justify-center"} />
          {state === "loading" && <div className="absolute inset-0 animate-pulse rounded-full border bg-muted/60" aria-label="লোড হচ্ছে" />}
          {state === "working" && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm font-semibold text-primary">
              <span className="size-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" aria-hidden />
              লগইন করা হচ্ছে…
            </div>
          )}
        </div>
      )}
      {error && <p className="mt-2 text-center text-xs text-destructive">{error}</p>}
      <div className="mt-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        অথবা ইমেইল দিয়ে
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
