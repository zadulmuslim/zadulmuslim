import { Star } from "lucide-react";
import { appStores } from "@/data/home";
import { Button } from "@/components/ui/button";

export function AppDownload() {
  return (
    <section aria-labelledby="app-title" className="mx-auto max-w-6xl px-4 pt-14">
      <div className="flex flex-col gap-6 rounded-2xl border bg-card p-8 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 id="app-title" className="text-xl font-bold md:text-2xl">অ্যাপ ডাউনলোড করুন</h2>
          <p className="mt-1 text-sm text-muted-foreground">হাতের মুঠোয় ইসলামী জ্ঞানের ভান্ডার — অনলাইনে ও অফলাইনে।</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {appStores.map((s) => (
              <Button key={s.label} asChild variant="outline" size="sm" className="rounded-lg">
                <a href={s.href}>{s.label}</a>
              </Button>
            ))}
          </div>
        </div>
        <div className="text-center">
          <p className="flex items-center justify-center gap-1 text-3xl font-bold text-primary">
            ৪.৯ <Star className="size-7 fill-primary" aria-hidden />
          </p>
          <p className="text-xs text-muted-foreground">রেটিং</p>
        </div>
      </div>
    </section>
  );
}
