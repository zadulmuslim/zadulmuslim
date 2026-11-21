import "server-only";
import { siteConfig } from "@/config/site";

/**
 * Transactional email through Resend's HTTP API (no SDK needed).
 * Configure RESEND_API_KEY and EMAIL_FROM (e.g. "যাদুল মুসলিম <no-reply@zadulmuslim.org>")
 * in Vercel. Without them, nothing is sent and callers are told so.
 */
export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(msg: { to: string; subject: string; html: string; text: string }): Promise<{ sent: boolean; reason?: string }> {
  if (!emailConfigured()) return { sent: false, reason: "not_configured" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [msg.to], subject: msg.subject, html: msg.html, text: msg.text }),
    });
    if (!res.ok) {
      console.error("[email]", res.status, await res.text().catch(() => ""));
      return { sent: false, reason: "provider_error" };
    }
    return { sent: true };
  } catch (err) {
    console.error("[email]", err);
    return { sent: false, reason: "network_error" };
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Branded wrapper matching the Supabase auth templates. */
export function brandedEmail({ heading, paragraphs, button }: { heading: string; paragraphs: string[]; button?: { label: string; url: string } }): string {
  const body = paragraphs.map((p) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.8;">${p}</p>`).join("");
  const btn = button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:22px auto;"><tr><td align="center" style="border-radius:999px;background:#c9952b;"><a href="${esc(button.url)}" target="_blank" style="display:inline-block;padding:13px 30px;font-size:16px;font-weight:700;color:#064d26;text-decoration:none;border-radius:999px;">${esc(button.label)}</a></td></tr></table>`
    : "";
  return `<!DOCTYPE html><html lang="bn"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f6f3ea;font-family:'Hind Siliguri','Noto Sans Bengali',Arial,sans-serif;color:#1f2a24;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ea;"><tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td style="background:#064d26;border-radius:16px 16px 0 0;border-bottom:4px solid #c9952b;padding:20px 26px;">
<div style="font-size:22px;font-weight:700;color:#fff;">${siteConfig.nameBn}</div><div style="font-size:12px;color:#f3e3bd;">${siteConfig.tagline}</div></td></tr>
<tr><td style="background:#fff;padding:28px 26px;border-left:1px solid #e5dfcd;border-right:1px solid #e5dfcd;">
<h1 style="margin:0 0 14px;font-size:21px;color:#0b6b31;">${esc(heading)}</h1>
<p style="margin:0 0 10px;font-size:15px;">আসসালামু আলাইকুম,</p>${body}${btn}</td></tr>
<tr><td style="background:#064d26;border-radius:0 0 16px 16px;padding:16px 26px;text-align:center;font-size:12px;color:#d9e6dc;">
${siteConfig.nameBn} · ${siteConfig.footerAbout}<br><a href="${siteConfig.url}" style="color:#f3e3bd;text-decoration:none;">www.zadulmuslim.org</a></td></tr>
</table></td></tr></table></body></html>`;
}

export { esc as escapeHtml };
