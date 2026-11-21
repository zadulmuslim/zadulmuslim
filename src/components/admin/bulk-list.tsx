"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { useDialog } from "@/components/ui/dialogs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NativeSelect } from "@/components/ui/native-select";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage, type FormState } from "@/components/ui/form-message";
import { RowActions } from "./row-actions";
import { StatusBadge } from "./status-badge";
import { toBnDigits } from "@/lib/utils";

export interface BulkRow {
  id: string;
  title: string;
  meta: string;
  status: string;
  editHref: string;
  viewHref?: string | null;
}

/** List with checkboxes and a bulk-action bar (publish, delete, move to category…). */
export function BulkList({
  rows,
  ops,
  categories,
  bulkAction,
  deleteAction,
  noun,
  emptyText,
}: {
  rows: BulkRow[];
  ops: { value: string; label: string; danger?: boolean }[];
  categories: { id: string; name_bn: string }[];
  bulkAction: (prev: FormState, fd: FormData) => Promise<FormState>;
  deleteAction: (fd: FormData) => Promise<void>;
  noun: string;
  emptyText: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [op, setOp] = useState("");
  const [state, action] = useActionState(bulkAction, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) {
      setSelected(new Set());
      setOp("");
      router.refresh();
    }
  }, [state, router]);

  const all = rows.length > 0 && selected.size === rows.length;
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const danger = ops.find((o) => o.value === op)?.danger;
  const dialog = useDialog();
  const confirmed = useRef(false);

  return (
    <div>
      <FormMessage state={state} className="mb-3" />
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <form
          action={action}
          onSubmit={async (e) => {
            if (!danger || confirmed.current) {
              confirmed.current = false;
              return;
            }
            e.preventDefault();
            const form = e.currentTarget;
            const ok = await dialog.confirm({
              title: `${toBnDigits(selected.size)}টি ${noun} মুছে ফেলবেন?`,
              message: "বাছাই করা সবগুলো স্থায়ীভাবে মুছে যাবে এবং আর ফেরত আনা যাবে না।",
              tone: "danger",
            });
            if (ok) {
              confirmed.current = true;
              form.requestSubmit();
            }
          }}
          className="flex flex-wrap items-center gap-3 border-b bg-secondary/40 px-4 py-2.5"
        >
          {[...selected].map((id) => <input key={id} type="hidden" name="ids" value={id} />)}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={all}
              onChange={() => setSelected(all ? new Set() : new Set(rows.map((r) => r.id)))}
              className="size-4 accent-[var(--primary)]"
              aria-label="সব বাছাই করুন"
            />
            {selected.size ? `${toBnDigits(selected.size)}টি বাছাই করা` : "সব বাছাই"}
          </label>
          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <NativeSelect name="op" value={op} onChange={(e) => setOp(e.target.value)} className="h-9 w-44" aria-label="কাজ বেছে নিন">
                <option value="">— কাজ বেছে নিন —</option>
                {ops.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </NativeSelect>
              {op === "category" && (
                <NativeSelect name="category_id" className="h-9 w-44" aria-label="নতুন বিষয়" required>
                  <option value="">— বিষয় —</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name_bn}</option>)}
                </NativeSelect>
              )}
              <SubmitButton size="sm" disabled={!op} variant={danger ? "outline" : "default"} className={danger ? "border-destructive text-destructive" : ""} pendingText="…">
                প্রয়োগ করুন
              </SubmitButton>
            </div>
          )}
        </form>
        {rows.length ? (
          <ul className="divide-y">
            {rows.map((r) => (
              <li key={r.id} className={`flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${selected.has(r.id) ? "bg-accent/5" : "hover:bg-secondary/40"}`}>
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggle(r.id)}
                    className="mt-1 size-4 shrink-0 accent-[var(--primary)]"
                    aria-label={`বাছাই: ${r.title}`}
                  />
                  <Link href={r.editHref} className="min-w-0 flex-1">
                    <span className="block truncate font-medium hover:text-primary">{r.title}</span>
                    <span className="text-xs text-muted-foreground">{r.meta}</span>
                  </Link>
                </div>
                <div className="flex items-center gap-3 pl-7 sm:pl-0">
                  <StatusBadge status={r.status} />
                  {r.viewHref && (
                    <a href={r.viewHref} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-primary hover:underline">দেখুন ↗</a>
                  )}
                  <RowActions id={r.id} editHref={r.editHref} deleteAction={deleteAction} confirmTitle={`এই ${noun}টি মুছে ফেলবেন?`} confirmText={`“${r.title}” স্থায়ীভাবে মুছে যাবে এবং আর ফেরত আনা যাবে না।`} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">{emptyText}</p>
        )}
      </div>
    </div>
  );
}
