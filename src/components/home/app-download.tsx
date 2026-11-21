import { Smartphone } from "lucide-react";
import { siteConfig } from "@/config/site";

/** Honest app section: the site installs like an app until native apps ship. */
export function AppDownload() {
  return (
    <section aria-labelledby="app-title" className="mx-auto max-w-6xl px-4 pt-14">
      <div className="flex flex-col gap-6 rounded-2xl border bg-card p-6 shadow-sm md:flex-row md:items-center md:p-8">
        <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-primary text-accent">
          <Smartphone className="size-8" aria-hidden />
        </div>
        <div className="flex-1">
          <h2 id="app-title" className="text-xl font-bold md:text-2xl">মোবাইলে অ্যাপের মতো ব্যবহার করুন</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {siteConfig.nameBn}-এর মোবাইল অ্যাপ তৈরির কাজ চলছে। ততদিন ব্রাউজারের মেনু থেকে <strong>“Add to Home screen”</strong> (হোম স্ক্রিনে যোগ করুন) বেছে নিলেই সাইটটি অ্যাপের মতো এক ট্যাপে খুলবে।
          </p>
        </div>
      </div>
    </section>
  );
}
