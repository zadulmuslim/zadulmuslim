"use client";
import { useActionState, useState } from "react";
import { saveArticle } from "@/app/actions/admin/articles";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { SubmitButton } from "@/components/ui/submit-button";
import { FieldError, FormMessage, type FormState } from "@/components/ui/form-message";
import { MarkdownEditor } from "./markdown-editor";
import { ImagePicker } from "./image-picker";

export interface ArticleFormValues {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  category_id: string | null;
  author_name: string | null;
  status: string;
  featured: { id: string; url: string } | null;
}

export function ArticleForm({
  values,
  categories,
  initialState = null,
}: {
  values?: ArticleFormValues;
  categories: { id: string; name_bn: string }[];
  initialState?: FormState;
}) {
  const [state, action] = useActionState(saveArticle, initialState);
  const [inlineIds, setInlineIds] = useState<string[]>([]);
  const published = values?.status === "published";

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[1fr_300px]">
      <input type="hidden" name="id" value={values?.id ?? ""} />
      <input type="hidden" name="inline_media_ids" value={inlineIds.join(",")} />
      <div className="space-y-5">
        <FormMessage state={state} />
        <div>
          <Label htmlFor="title">শিরোনাম</Label>
          <Input id="title" name="title" defaultValue={values?.title} className="h-12 rounded-lg text-lg font-semibold" required />
          <FieldError state={state} name="title" />
        </div>
        <div>
          <Label htmlFor="excerpt">সংক্ষিপ্ত বিবরণ</Label>
          <Textarea id="excerpt" name="excerpt" defaultValue={values?.excerpt ?? ""} rows={2} maxLength={500} placeholder="তালিকা ও সার্চ ফলাফলে দেখানো হবে (১–২ বাক্য)।" />
        </div>
        <div>
          <Label htmlFor="body">মূল লেখা</Label>
          <MarkdownEditor
            id="body"
            name="body"
            defaultValue={values?.body ?? ""}
            rows={24}
            imageCategory="article-inline"
            onMediaUploaded={(id) => setInlineIds((ids) => [...ids, id])}
          />
          <FieldError state={state} name="body" />
        </div>
      </div>

      <aside className="space-y-4">
        <div className="flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-sm">
          <SubmitButton name="intent" value="publish" pendingText="প্রকাশ হচ্ছে…">{published ? "পরিবর্তন প্রকাশ করুন" : "প্রকাশ করুন"}</SubmitButton>
          <SubmitButton name="intent" value="draft" variant="outline" pendingText="সংরক্ষণ হচ্ছে…">
            {published ? "খসড়ায় ফিরিয়ে নিন" : "খসড়া সংরক্ষণ"}
          </SubmitButton>
          {values?.id && values.status !== "archived" && (
            <SubmitButton name="intent" value="archive" variant="ghost" pendingText="…">আর্কাইভ করুন</SubmitButton>
          )}
        </div>
        <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
          <div>
            <Label>প্রধান ছবি</Label>
            <ImagePicker name="featured_media_id" category="article-featured" initial={values?.featured} />
          </div>
          <div>
            <Label htmlFor="category_id">বিষয়</Label>
            <NativeSelect id="category_id" name="category_id" defaultValue={values?.category_id ?? ""}>
              <option value="">— বিষয় বেছে নিন —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name_bn}</option>)}
            </NativeSelect>
          </div>
          <div>
            <Label htmlFor="author_name">লেখক</Label>
            <Input id="author_name" name="author_name" defaultValue={values?.author_name ?? ""} className="rounded-lg" placeholder="যেমন: মুফতী …" />
          </div>
          <div>
            <Label htmlFor="slug">স্লাগ (URL)</Label>
            <Input id="slug" name="slug" defaultValue={values?.slug ?? ""} className="rounded-lg" placeholder="খালি রাখলে শিরোনাম থেকে" />
            <FieldError state={state} name="slug" />
          </div>
        </div>
      </aside>
    </form>
  );
}
