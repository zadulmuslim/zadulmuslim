import { ExternalLink } from "lucide-react";
import { StatusBadge } from "./status-badge";
import { ConfirmDeleteForm } from "./row-actions";

/** Status, dates, public link and delete — one tidy bar under the page title. */
export function EditStatusBar({
  id,
  status,
  details,
  viewHref,
  deleteAction,
  confirmText,
}: {
  id: string;
  status: string;
  details: string[];
  viewHref?: string | null;
  deleteAction: (fd: FormData) => Promise<void>;
  confirmText: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        <StatusBadge status={status} />
        {details.map((d) => <span key={d}>{d}</span>)}
      </div>
      <div className="flex items-center gap-2">
        {viewHref && (
          <a href={viewHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium hover:border-accent hover:text-primary">
            সাইটে দেখুন <ExternalLink className="size-3" />
          </a>
        )}
        <ConfirmDeleteForm id={id} action={deleteAction} confirmTitle={confirmText} confirmText="এটি স্থায়ীভাবে মুছে যাবে এবং আর ফেরত আনা যাবে না।" />
      </div>
    </div>
  );
}
