/**
 * Prints (or saves as PDF) just one section of the page, not the whole page.
 * The section is copied into a hidden frame with the site's styles, a small
 * header (site name, title, date) and a footer with the page address.
 */
export function printSection(el: HTMLElement | null, title: string): void {
  if (!el || typeof window === "undefined") return;
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (!doc || !win) return frame.remove();

  const styles = [...document.querySelectorAll<HTMLElement>('link[rel="stylesheet"], style')].map((n) => n.outerHTML).join("\n");
  const date = new Date().toLocaleDateString("bn-BD", { timeZone: "Asia/Dhaka", day: "numeric", month: "long", year: "numeric" });
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  const clone = el.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("[data-print-hide], .print\\:hidden, button, script").forEach((n) => n.remove());
  clone.classList.remove("lg:sticky", "sticky", "shadow-md", "shadow-sm");

  doc.open();
  doc.write(`<!DOCTYPE html><html lang="bn" class="${document.documentElement.className}"><head><meta charset="utf-8">
<base href="${location.origin}/"><title>${esc(title)} — যাদুল মুসলিম</title>${styles}
<style>
  @page { margin: 14mm; }
  html, body { background: #fff !important; }
  body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .zm-print { max-width: 760px; margin: 0 auto; }
  .zm-print-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; border-bottom: 2px solid #064d26; padding-bottom: 8px; margin-bottom: 14px; }
  .zm-print-foot { margin-top: 14px; border-top: 1px solid #ddd; padding-top: 6px; font-size: 11px; color: #666; display: flex; justify-content: space-between; gap: 12px; }
  .overflow-x-auto { overflow: visible !important; }
  table { min-width: 0 !important; }
  tr { break-inside: avoid; }
</style></head>
<body class="${document.body.className}"><div class="zm-print">
  <div class="zm-print-head">
    <div><div style="font-weight:700;font-size:20px;color:#064d26">যাদুল মুসলিম</div><div style="font-size:14px">${esc(title)}</div></div>
    <div style="font-size:12px;color:#555">${esc(date)}</div>
  </div>
  <div id="zm-print-body"></div>
  <div class="zm-print-foot"><span>zadulmuslim.org</span><span>${esc(location.origin + location.pathname)}</span></div>
</div></body></html>`);
  doc.close();
  doc.getElementById("zm-print-body")?.appendChild(doc.importNode(clone, true));

  let done = false;
  const go = () => {
    if (done) return;
    done = true;
    win.focus();
    win.print();
    setTimeout(() => frame.remove(), 1000);
  };
  // Wait for styles and fonts, but never hang.
  const links = [...doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')];
  Promise.all([
    ...links.map((l) => (l.sheet ? Promise.resolve() : new Promise<void>((r) => { l.onload = l.onerror = () => r(); }))),
    doc.fonts?.ready ?? Promise.resolve(),
  ]).then(() => setTimeout(go, 50));
  setTimeout(go, 2500);
}
