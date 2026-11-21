import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { LectureForm } from "@/components/admin/library-forms";

export const metadata: Metadata = { title: "নতুন বয়ান" };

export default function NewLecture() {
  return (
    <>
      <PageHeader title="নতুন বয়ান" />
      <LectureForm />
    </>
  );
}
