"use client";
import { useActionState } from "react";
import { saveQuestion } from "@/app/actions/admin/questions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { SubmitButton } from "@/components/ui/submit-button";
import { FieldError, FormMessage, type FormState } from "@/components/ui/form-message";
import { RichEditor } from "./rich-editor";

export interface QuestionFormValues {
  id?: string;
  title: string;
  question: string;
  answer: string | null;
  category_id: string | null;
  slug: string | null;
  is_public: boolean;
  status: string;
}

export function QuestionForm({
  values,
  categories,
  initialState = null,
}: {
  values?: QuestionFormValues;
  categories: { id: string; name_bn: string }[];
  initialState?: FormState;
}) {
  const [state, action] = useActionState(saveQuestion, initialState);
  const published = values?.status === "answered";

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[1fr_300px]">
      <input type="hidden" name="id" value={values?.id ?? ""} />
      <div className="space-y-5">
        <FormMessage state={state} />
        <div>
          <Label htmlFor="title">শিরোনাম</Label>
          <Input id="title" name="title" defaultValue={values?.title} className="rounded-lg" placeholder="যেমন: বিতর নামায পড়ার সহীহ নিয়ম কী?" required />
          <p className="mt-1 text-xs text-muted-foreground">প্রশ্নকারীর লেখা থেকে সংক্ষিপ্ত ও পরিষ্কার শিরোনাম দিন (নাম বা ব্যক্তিগত তথ্য বাদে)।</p>
          <FieldError state={state} name="title" />
        </div>
        <div>
          <Label htmlFor="question">প্রশ্ন</Label>
          <Textarea id="question" name="question" defaultValue={values?.question} rows={6} required />
          <FieldError state={state} name="question" />
        </div>
        <div>
          <Label htmlFor="answer">উত্তর</Label>
          <RichEditor
            id="answer"
            name="answer"
            defaultValue={values?.answer ?? ""}
            minHeight={360}
            imageCategory="article-inline"
            placeholder="উত্তর লিখুন… দলীল উদ্ধৃত করতে উদ্ধৃতি (❝) বাটন ব্যবহার করুন।"
          />
          <FieldError state={state} name="answer" />
        </div>
      </div>

      <aside className="space-y-4">
        <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
          <div>
            <Label htmlFor="category_id">বিষয়</Label>
            <NativeSelect id="category_id" name="category_id" defaultValue={values?.category_id ?? ""}>
              <option value="">— বিষয় বেছে নিন —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name_bn}</option>)}
            </NativeSelect>
          </div>
          <div>
            <Label htmlFor="slug">স্লাগ (URL)</Label>
            <Input id="slug" name="slug" defaultValue={values?.slug ?? ""} className="rounded-lg" placeholder="খালি রাখলে স্বয়ংক্রিয়" />
            <FieldError state={state} name="slug" />
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="is_public" defaultChecked={values?.is_public ?? true} className="mt-1 size-4 accent-[var(--primary)]" />
            <span>সবার জন্য প্রকাশযোগ্য<span className="block text-xs text-muted-foreground">বন্ধ রাখলে শুধু প্রশ্নকারী উত্তর দেখবেন।</span></span>
          </label>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-sm">
          <SubmitButton name="intent" value="publish" pendingText="প্রকাশ হচ্ছে…">
            {published ? "পরিবর্তন প্রকাশ করুন" : "উত্তর প্রকাশ করুন"}
          </SubmitButton>
          {!published && (
            <SubmitButton name="intent" value="save" variant="outline" pendingText="সংরক্ষণ হচ্ছে…">খসড়া সংরক্ষণ</SubmitButton>
          )}
          {published && (
            <SubmitButton name="intent" value="unpublish" variant="outline" pendingText="…">প্রকাশ বন্ধ করুন</SubmitButton>
          )}
          {values?.id && values.status !== "rejected" && !published && (
            <SubmitButton name="intent" value="reject" variant="ghost" className="text-destructive hover:bg-destructive/5" pendingText="…">
              প্রশ্ন বাতিল করুন
            </SubmitButton>
          )}
        </div>
      </aside>
    </form>
  );
}
