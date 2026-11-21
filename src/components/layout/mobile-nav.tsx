"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { mainNav } from "@/config/site";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="xl:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="grid size-10 place-items-center rounded-full text-white hover:bg-white/10"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "মেনু বন্ধ করুন" : "মেনু খুলুন"}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>
      {open && (
        <nav id="mobile-menu" className="absolute inset-x-0 top-full z-40 border-t border-accent/40 bg-brand-deep shadow-lg">
          <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-1 p-4">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="block rounded-lg px-3 py-2 text-sm text-white/90 hover:bg-white/10">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
