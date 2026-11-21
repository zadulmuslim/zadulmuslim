import { cn } from "@/lib/utils";

const MAP: Record<string, { label: string; className: string }> = {
  draft: { label: "খসড়া", className: "bg-secondary text-foreground" },
  published: { label: "প্রকাশিত", className: "bg-primary/10 text-primary border-primary/30" },
  archived: { label: "আর্কাইভ", className: "bg-muted text-muted-foreground" },
  pending: { label: "অপেক্ষমাণ", className: "bg-amber-50 text-amber-800 border-amber-300" },
  in_review: { label: "পর্যালোচনায়", className: "bg-sky-50 text-sky-800 border-sky-300" },
  answered: { label: "উত্তর প্রকাশিত", className: "bg-primary/10 text-primary border-primary/30" },
  rejected: { label: "বাতিল", className: "bg-destructive/5 text-destructive border-destructive/30" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = MAP[status] ?? { label: status, className: "" };
  return <span className={cn("inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium", s.className)}>{s.label}</span>;
}
