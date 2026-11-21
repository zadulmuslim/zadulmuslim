"use client";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useDialog } from "@/components/ui/dialogs";

function DeleteSubmit({ confirmText, confirmTitle = "মুছে ফেলবেন?" }: { confirmText: string; confirmTitle?: string }) {
  const { pending } = useFormStatus();
  const dialog = useDialog();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="মুছুন"
      title="মুছুন"
      onClick={async (e) => {
        e.preventDefault();
        const btn = e.currentTarget;
        if (await dialog.confirm({ title: confirmTitle, message: confirmText, tone: "danger" })) btn.form?.requestSubmit(btn);
      }}
      className="inline-flex items-center gap-1 rounded-full border border-transparent px-2.5 py-1 text-xs font-medium text-destructive hover:border-destructive/30 hover:bg-destructive/5 disabled:opacity-50"
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
      <span className="hidden sm:inline">মুছুন</span>
    </button>
  );
}

/** Edit + delete buttons for a list row. `deleteAction` is a Server Action taking FormData with `id`. */
export function RowActions({
  id,
  editHref,
  deleteAction,
  confirmText = "এটি স্থায়ীভাবে মুছে যাবে এবং আর ফেরত আনা যাবে না।",
  confirmTitle,
}: {
  id: string;
  editHref: string;
  deleteAction: (formData: FormData) => Promise<void>;
  confirmText?: string;
  confirmTitle?: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Link
        href={editHref}
        className="inline-flex items-center gap-1 rounded-full border border-primary/30 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/5"
      >
        <Pencil className="size-3.5" />
        সম্পাদনা
      </Link>
      <form action={deleteAction}>
        <input type="hidden" name="id" value={id} />
        <DeleteSubmit confirmText={confirmText} confirmTitle={confirmTitle} />
      </form>
    </div>
  );
}

/** Standalone delete button with confirmation (used on edit pages). */
export function ConfirmDeleteForm({
  id,
  action,
  confirmText = "এটি স্থায়ীভাবে মুছে যাবে এবং আর ফেরত আনা যাবে না।",
  confirmTitle,
}: {
  id: string;
  action: (formData: FormData) => Promise<void>;
  confirmText?: string;
  confirmTitle?: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <DeleteSubmit confirmText={confirmText} confirmTitle={confirmTitle} />
    </form>
  );
}
