"use client";
import { useEffect, useState } from "react";

/** Today's Hijri and Gregorian date in Bengali (rendered in the browser so it is always current). */
export function HijriDate({ className }: { className?: string }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    try {
      const now = new Date();
      const hijri = new Intl.DateTimeFormat("bn-BD-u-ca-islamic-umalqura", { day: "numeric", month: "long", year: "numeric" }).format(now);
      const greg = new Intl.DateTimeFormat("bn-BD", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(now);
      setText(`${greg} · ${hijri.replace(/যুগ|AH/g, "").trim()} হিজরি`);
    } catch {
      setText(null);
    }
  }, []);
  if (!text) return null;
  return <p className={className}>{text}</p>;
}
