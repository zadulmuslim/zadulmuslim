"use client";
import { useActionState } from "react";
import { saveBook, saveLecture } from "@/app/actions/admin/library";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { SubmitButton } from "@/components/ui/submit-button";
import { FieldError, FormMessage, type FormState } from "@/components/ui/form-message";
import { MediaPicker, type PickedMedia } from "./media-picker";

const field = "rounded-lg";

function Actions({ published, noun }: { published: boolean; noun: string }) {
  return (
    <div className="space-y-2 rounded-xl border bg-card p-4 shadow-sm">
      <SubmitButton name="intent" value="publish" className="w-full" pendingText="প্রকাশ হচ্ছে…">{published ? "পরিবর্তন প্রকাশ করুন" : `${noun} প্রকাশ করুন`}</SubmitButton>
      <SubmitButton name="intent" value="draft" variant="outline" className="w-full" pendingText="সংরক্ষণ হচ্ছে…">{published ? "অপ্রকাশিত করে খসড়ায় রাখুন" : "খসড়া সংরক্ষণ"}</SubmitButton>
    </div>
  );
}

export interface LectureValues {
  id: string; title: string; slug: string; speaker: string | null; description: string | null; kind: string;
  external_video_url: string | null; duration_seconds: number | null; status: string;
  thumbnail: PickedMedia | null; video: PickedMedia | null; audio: PickedMedia | null;
}

export function LectureForm({ values, initialState = null }: { values?: LectureValues; initialState?: FormState }) {
  const [state, action] = useActionState(saveLecture, initialState);
  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[1fr_300px]">
      <input type="hidden" name="id" value={values?.id ?? ""} />
      <div className="space-y-5">
        <FormMessage state={state} />
        <div>
          <Label htmlFor="title">শিরোনাম</Label>
          <Input id="title" name="title" defaultValue={values?.title} required placeholder="যেমন: রমযানের প্রস্তুতি" className="h-12 rounded-lg text-lg font-semibold" />
          <FieldError state={state} name="title" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="speaker">বক্তা</Label>
            <Input id="speaker" name="speaker" defaultValue={values?.speaker ?? ""} placeholder="বক্তার নাম" className={field} />
          </div>
          <div>
            <Label htmlFor="kind">ধরন</Label>
            <NativeSelect id="kind" name="kind" defaultValue={values?.kind ?? "video"}>
              <option value="video">ভিডিও বয়ান</option>
              <option value="audio">অডিও বয়ান</option>
              <option value="nasheed">হামদ ও নাত</option>
            </NativeSelect>
          </div>
        </div>
        <div>
          <Label htmlFor="external_video_url">YouTube লিংক</Label>
          <Input id="external_video_url" name="external_video_url" defaultValue={values?.external_video_url ?? ""} placeholder="https://www.youtube.com/watch?v=…" dir="ltr" className={field} />
          <p className="mt-1 text-xs text-muted-foreground">YouTube-এ থাকলে লিংক দিন; না থাকলে নিচে ভিডিও বা অডিও ফাইল আপলোড করুন।</p>
          <FieldError state={state} name="external_video_url" />
        </div>
        <div>
          <Label htmlFor="description">বিবরণ</Label>
          <Textarea id="description" name="description" defaultValue={values?.description ?? ""} rows={6} placeholder="বয়ানের বিষয়বস্তু, স্থান ও তারিখ ইত্যাদি" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <MediaPicker name="audio_media_id" category="audio" kind="audio" label="অডিও ফাইল (ঐচ্ছিক)" initial={values?.audio} />
          <MediaPicker name="video_media_id" category="lecture-video" kind="video" label="ভিডিও ফাইল (ঐচ্ছিক)" initial={values?.video} />
        </div>
      </div>
      <aside className="space-y-5">
        <Actions published={values?.status === "published"} noun="বয়ান" />
        <MediaPicker name="thumbnail_media_id" category="lecture-thumbnail" kind="image" label="থাম্বনেইল (না দিলে YouTube-এর ছবি)" initial={values?.thumbnail} />
        <div>
          <Label htmlFor="duration_min">দৈর্ঘ্য (মিনিট)</Label>
          <Input id="duration_min" name="duration_min" inputMode="numeric" defaultValue={values?.duration_seconds ? String(Math.round(values.duration_seconds / 60)) : ""} placeholder="যেমন: ৪৫" className={field} />
        </div>
        <div>
          <Label htmlFor="slug">স্লাগ (URL)</Label>
          <Input id="slug" name="slug" defaultValue={values?.slug ?? ""} placeholder="ফাঁকা রাখলে শিরোনাম থেকে" className={field} />
          <FieldError state={state} name="slug" />
        </div>
      </aside>
    </form>
  );
}

export interface BookValues {
  id: string; title: string; slug: string; author_name: string | null; subject: string | null; description: string | null; status: string;
  cover: PickedMedia | null; file: PickedMedia | null;
}

export function BookForm({ values, subjects, initialState = null }: { values?: BookValues; subjects: string[]; initialState?: FormState }) {
  const [state, action] = useActionState(saveBook, initialState);
  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[1fr_300px]">
      <input type="hidden" name="id" value={values?.id ?? ""} />
      <div className="space-y-5">
        <FormMessage state={state} />
        <div>
          <Label htmlFor="title">বইয়ের নাম</Label>
          <Input id="title" name="title" defaultValue={values?.title} required placeholder="বইয়ের নাম" className="h-12 rounded-lg text-lg font-semibold" />
          <FieldError state={state} name="title" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="author_name">লেখক / অনুবাদক</Label>
            <Input id="author_name" name="author_name" defaultValue={values?.author_name ?? ""} placeholder="লেখকের নাম" className={field} />
          </div>
          <div>
            <Label htmlFor="subject">বিষয়</Label>
            <Input id="subject" name="subject" defaultValue={values?.subject ?? ""} list="book-subjects" placeholder="যেমন: আকিদা, ফিকহ, সীরাত" className={field} />
            <datalist id="book-subjects">{subjects.map((s) => <option key={s} value={s} />)}</datalist>
          </div>
        </div>
        <div>
          <Label htmlFor="description">বইয়ের পরিচিতি</Label>
          <Textarea id="description" name="description" defaultValue={values?.description ?? ""} rows={7} placeholder="বইটি কী নিয়ে, কাদের জন্য উপযোগী" />
        </div>
        <MediaPicker name="file_media_id" category="book" kind="pdf" label="বইয়ের ফাইল (PDF বা EPUB)" initial={values?.file} />
        <p className="text-xs text-muted-foreground">শুধু সেসব বই আপলোড করুন যেগুলো বিনামূল্যে প্রকাশের অনুমতি আছে (লেখক/প্রকাশকের অনুমতি বা উন্মুক্ত লাইসেন্স)।</p>
      </div>
      <aside className="space-y-5">
        <Actions published={values?.status === "published"} noun="বই" />
        <MediaPicker name="cover_media_id" category="book" kind="image" label="প্রচ্ছদ" initial={values?.cover} />
        <div>
          <Label htmlFor="slug">স্লাগ (URL)</Label>
          <Input id="slug" name="slug" defaultValue={values?.slug ?? ""} placeholder="ফাঁকা রাখলে নাম থেকে" className={field} />
          <FieldError state={state} name="slug" />
        </div>
      </aside>
    </form>
  );
}
