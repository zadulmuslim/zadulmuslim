import "server-only";
import type { CaptchaChallenge } from "@/lib/captcha-types";
import { randomBytes, randomInt } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdmin } from "@/lib/env";
import { hasSigningSecret, normalizeDigits, safeEqual, sign } from "@/lib/auth/secret";

/**
 * Zadulmuslim's own captcha: a small arithmetic question drawn as distorted
 * strokes (no text in the image), signed with an HMAC so the server keeps no
 * state until it is answered. Each challenge can be used once (captcha_used),
 * expires after 10 minutes, and must not be answered faster than a human can.
 */

const TTL_MS = 10 * 60_000;
const MIN_AGE_MS = 1_500;

type Stroke = [number, number][];
// Glyphs on a 10×16 grid, drawn as polylines.
const GLYPHS: Record<string, Stroke[]> = {
  "0": [[[3, 0], [7, 0], [10, 4], [10, 12], [7, 16], [3, 16], [0, 12], [0, 4], [3, 0]]],
  "1": [[[2, 4], [6, 0], [6, 16]], [[2, 16], [10, 16]]],
  "2": [[[0, 3], [3, 0], [8, 0], [10, 3], [10, 6], [0, 16], [10, 16]]],
  "3": [[[0, 1], [9, 0], [10, 4], [4, 8], [10, 11], [9, 16], [0, 15]]],
  "4": [[[8, 16], [8, 0], [0, 11], [10, 11]]],
  "5": [[[10, 0], [1, 0], [0, 7], [8, 7], [10, 10], [9, 15], [0, 16]]],
  "6": [[[9, 0], [3, 2], [0, 9], [0, 14], [4, 16], [9, 15], [10, 11], [6, 8], [0, 10]]],
  "7": [[[0, 0], [10, 0], [3, 16]]],
  "8": [[[5, 8], [1, 5], [2, 0], [8, 0], [9, 5], [5, 8], [0, 12], [2, 16], [8, 16], [10, 12], [5, 8]]],
  "9": [[[10, 6], [4, 8], [0, 5], [1, 1], [6, 0], [10, 3], [10, 9], [7, 16], [1, 16]]],
  "+": [[[5, 3], [5, 13]], [[0, 8], [10, 8]]],
  "-": [[[1, 8], [9, 8]]],
  "=": [[[1, 5], [9, 5]], [[1, 11], [9, 11]]],
  "?": [[[1, 3], [4, 0], [8, 0], [10, 3], [9, 6], [5, 9], [5, 12]], [[5, 15], [5, 16]]],
};

const COLORS = ["#064d26", "#0b6b31", "#8a5a12", "#1f2a24", "#7a3e1d"];
const rnd = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

function draw(text: string): string {
  const W = 220;
  const H = 64;
  const parts: string[] = [];
  // Background noise: dots and curves.
  for (let i = 0; i < 40; i++) parts.push(`<circle cx="${rnd(0, W).toFixed(1)}" cy="${rnd(0, H).toFixed(1)}" r="${rnd(0.6, 1.8).toFixed(1)}" fill="${pick(COLORS)}" opacity="${rnd(0.15, 0.45).toFixed(2)}"/>`);
  for (let i = 0; i < 3; i++) {
    parts.push(`<path d="M${rnd(0, 20).toFixed(1)} ${rnd(5, H - 5).toFixed(1)} Q${rnd(60, 160).toFixed(1)} ${rnd(-20, H + 20).toFixed(1)} ${rnd(W - 20, W).toFixed(1)} ${rnd(5, H - 5).toFixed(1)}" stroke="${pick(COLORS)}" stroke-width="${rnd(1, 2).toFixed(1)}" fill="none" opacity="0.45"/>`);
  }
  const chars = [...text];
  const step = (W - 24) / chars.length;
  chars.forEach((ch, i) => {
    const g = GLYPHS[ch];
    if (!g) return;
    const scale = rnd(2.2, 2.7);
    const cx = 12 + i * step + step / 2 + rnd(-3, 3);
    const cy = H / 2 + rnd(-5, 5);
    const rot = rnd(-18, 18);
    const d = g
      .map((stroke) => stroke.map(([x, y], j) => `${j ? "L" : "M"}${(x + rnd(-0.7, 0.7)).toFixed(2)} ${(y + rnd(-0.7, 0.7)).toFixed(2)}`).join(""))
      .join("");
    parts.push(
      `<path transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${scale.toFixed(2)}) translate(-5 -8)" d="${d}" stroke="${pick(COLORS)}" stroke-width="${(1.1 + Math.random() * 0.35).toFixed(2)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    );
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#fbf8ef"/>${parts.join("")}</svg>`;
}

/** Captcha works only with a signing secret; in production a missing secret fails closed. */
/** A fresh challenge for the browser (rendered into the page so it shows instantly). */
export function issueChallenge(): CaptchaChallenge {
  return captchaEnabled() ? { enabled: true, ...createChallenge() } : { enabled: false };
}

export function captchaEnabled(): boolean {
  return hasSigningSecret();
}

export function createChallenge(): { token: string; image: string } {
  // Kept easy on purpose: small sums like 7+2 or 11+2, and small differences like 9-3.
  const plus = randomInt(0, 3) !== 0; // mostly addition
  let a: number;
  let b: number;
  if (plus) {
    if (randomInt(0, 4) === 0) {
      a = randomInt(10, 13); // 10–12 plus a tiny number
      b = randomInt(1, 4);
    } else {
      a = randomInt(1, 10);
      b = randomInt(1, 10 - Math.min(a, 9) + 1); // keeps the sum at 10 or less
    }
  } else {
    a = randomInt(4, 11); // 4–10
    b = randomInt(1, Math.min(4, a - 1) + 1); // result stays positive
  }
  const answer = plus ? a + b : a - b;
  const nonce = randomBytes(12).toString("base64url");
  const iat = Date.now().toString(36);
  const token = `${nonce}.${iat}.${sign("captcha", `${nonce}.${iat}.${answer}`)}`;
  const svg = draw(`${a}${plus ? "+" : "-"}${b}=?`);
  return { token, image: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}` };
}

export type CaptchaResult = { ok: true } | { ok: false; message: string };

const WRONG: CaptchaResult = { ok: false, message: "নিরাপত্তা প্রশ্নের উত্তর সঠিক হয়নি। নতুন প্রশ্নের উত্তর দিন।" };

/** Verifies the captcha fields of a submitted form (captcha_token, captcha_answer). */
export async function verifyCaptcha(formData: FormData): Promise<CaptchaResult> {
  if (!captchaEnabled()) {
    if (process.env.VERCEL_ENV === "production") return { ok: false, message: "নিরাপত্তা যাচাই সাময়িকভাবে বন্ধ। পরে আবার চেষ্টা করুন।" };
    return { ok: true }; // local/preview without secrets
  }
  const token = String(formData.get("captcha_token") ?? "");
  const answer = normalizeDigits(String(formData.get("captcha_answer") ?? ""));
  if (!answer) return { ok: false, message: "নিরাপত্তা প্রশ্নের উত্তর লিখুন।" };
  const [nonce, iat, sig] = token.split(".");
  if (!nonce || !iat || !sig || !/^\d{1,3}$/.test(answer)) return WRONG;
  const issued = parseInt(iat, 36);
  const age = Date.now() - issued;
  if (!Number.isFinite(issued) || age > TTL_MS) return { ok: false, message: "নিরাপত্তা প্রশ্নের মেয়াদ শেষ। নতুন প্রশ্নের উত্তর দিন।" };
  if (age < MIN_AGE_MS) return WRONG;

  // One use per challenge — consumed before checking, so guesses can't be retried.
  if (hasSupabaseAdmin()) {
    const { error } = await createAdminClient().from("captcha_used").insert({ nonce, expires_at: new Date(issued + TTL_MS).toISOString() });
    if (error) return error.code === "23505" ? { ok: false, message: "এই নিরাপত্তা প্রশ্নটি আগেই ব্যবহার হয়েছে। নতুন প্রশ্নের উত্তর দিন।" } : WRONG;
  }
  return safeEqual(sig, sign("captcha", `${nonce}.${iat}.${answer}`)) ? { ok: true } : WRONG;
}
