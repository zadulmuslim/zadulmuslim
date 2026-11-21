"use client";
import { useActionState } from "react";
import { saveCategory } from "@/app/actions/admin/categories";
import { Input } from "@/components/ui/input";
import { toBnDigits } from "@/lib/utils";
import { SubmitButton } from "@/components/ui/submit-button";
import { ConfirmDeleteForm } from "./row-actions";
import { deleteCategory } from "@/app/actions/admin/categories";

export interface CategoryValues {
  id?: string;
  name_bn: string;
  slug: string;
  description_bn?: string | null;
  sort_order: number;
  count?: number;
}

export function CategoryRow({ type, values }: { type: "question" | "article"; values?: CategoryValues }) {
  const [state, action] = useActionState(saveCategory, null);
  const isNew = !values?.id;
  return (
    <div className={`rounded-xl border bg-card p-4 shadow-sm ${isNew ? "border-dashed border-primary/40" : ""}`}>
      <form action={action} className="grid gap-3 md:grid-cols-[1.3fr_1fr_80px_auto] md:items-end">
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="id" value={values?.id ?? ""} />
        <label className="text-xs text-muted-foreground">
          নাম
          <Input name="name_bn" defaultValue={values?.name_bn} required className="mt-1 h-10 rounded-lg text-sm text-foreground" placeholder={isNew ? "নতুন বিষয়ের নাম" : ""} />
        </label>
        <label className="text-xs text-muted-foreground">
          স্লাগ (URL)
          <Input name="slug" defaultValue={values?.slug} className="mt-1 h-10 rounded-lg text-sm text-foreground" placeholder="যেমন: zakat" dir="ltr" />
        </label>
        <label className="text-xs text-muted-foreground">
          ক্রম
          <Input name="sort_order" type="number" min={0} defaultValue={values?.sort_order ?? 0} className="mt-1 h-10 rounded-lg text-sm text-foreground" />
        </label>
        <div className="flex items-center gap-2">
          <SubmitButton size="sm" pendingText="…">{isNew ? "যোগ করুন" : "সংরক্ষণ"}</SubmitButton>
        </div>
        {type === "article" && (
          <label className="text-xs text-muted-foreground md:col-span-4">
            সংক্ষিপ্ত বিবরণ
            <Input name="description_bn" defaultValue={values?.description_bn ?? ""} className="mt-1 h-10 rounded-lg text-sm text-foreground" />
          </label>
        )}
      </form>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{values?.count !== undefined && `${toBnDigits(values.count)}টি পোস্ট`}</span>
        <span className="flex items-center gap-3">
          {state?.message && <span className={state.ok ? "text-primary" : "text-destructive"}>{state.message}</span>}
          {values?.id && (
            <ConfirmDeleteForm
              id={values.id}
              action={async (fd: FormData) => {
                fd.set("type", type);
                await deleteCategory(fd);
              }}
              confirmText={`"${values.name_bn}" বিষয়টি মুছবেন? এর পোস্টগুলো মুছবে না, শুধু বিষয়হীন হয়ে যাবে।`}
            />
          )}
        </span>
      </div>
    </div>
  );
}
