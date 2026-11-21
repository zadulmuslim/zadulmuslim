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
  const formId = `cat-${values?.id ?? `new-${type}`}`;
  return (
    <div className={`rounded-xl border bg-card p-4 shadow-sm ${isNew ? "border-dashed border-primary/40" : ""}`}>
      <form id={formId} action={action} className="grid gap-3 sm:grid-cols-[1.4fr_1fr_88px]">
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
        {type === "article" && (
          <label className="text-xs text-muted-foreground sm:col-span-3">
            সংক্ষিপ্ত বিবরণ
            <Input name="description_bn" defaultValue={values?.description_bn ?? ""} className="mt-1 h-10 rounded-lg text-sm text-foreground" placeholder="বিষয়টি সম্পর্কে এক লাইনে" />
          </label>
        )}
      </form>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t pt-3 text-xs">
        <SubmitButton form={formId} size="sm" pendingText="সংরক্ষণ হচ্ছে…">{isNew ? "যোগ করুন" : "সংরক্ষণ"}</SubmitButton>
        {values?.count !== undefined && <span className="text-muted-foreground">{toBnDigits(values.count)}টি পোস্ট</span>}
        {state?.message && <span className={state.ok ? "text-primary" : "text-destructive"}>{state.message}</span>}
        {values?.id && (
          <span className="ml-auto">
            <ConfirmDeleteForm
              id={values.id}
              action={async (fd: FormData) => {
                fd.set("type", type);
                await deleteCategory(fd);
              }}
              confirmTitle={`“${values.name_bn}” বিষয়টি মুছবেন?`}
              confirmText={values.count ? `এই বিষয়ের ${toBnDigits(values.count)}টি পোস্ট মুছবে না, তবে সেগুলো বিষয়হীন হয়ে যাবে।` : "বিষয়টি স্থায়ীভাবে মুছে যাবে।"}
            />
          </span>
        )}
      </div>
    </div>
  );
}
