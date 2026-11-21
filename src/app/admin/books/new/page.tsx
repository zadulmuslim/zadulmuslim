import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/page-header";
import { BookForm } from "@/components/admin/library-forms";

export const metadata: Metadata = { title: "নতুন বই" };

export default async function NewBook() {
  const supabase = await createClient();
  const { data } = await supabase.from("books").select("subject").not("subject", "is", null).limit(500);
  const subjects = [...new Set((data ?? []).map((b) => b.subject!))];
  return (
    <>
      <PageHeader title="নতুন বই" />
      <BookForm subjects={subjects} />
    </>
  );
}
