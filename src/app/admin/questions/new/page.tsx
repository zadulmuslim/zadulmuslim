import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/page-header";
import { QuestionForm } from "@/components/admin/question-form";

export const metadata: Metadata = { title: "নতুন প্রশ্নোত্তর" };

export default async function NewQuestion() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("question_categories").select("id, name_bn").order("sort_order");
  return (
    <>
      <PageHeader title="নতুন প্রশ্নোত্তর" description="আগে থেকে থাকা প্রশ্নোত্তর বা সাধারণ মাসআলা সরাসরি যোগ করুন।" />
      <QuestionForm categories={categories ?? []} />
    </>
  );
}
