"use client";
import { useActionState, useRef, useState, useTransition } from "react";
import { Camera, Loader2 } from "lucide-react";
import { updateProfile } from "@/app/actions/account";
import { updateProfilePhoto } from "@/app/actions/media";
import { AvatarEditor } from "./avatar-editor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage, type FormState } from "@/components/ui/form-message";

export function ProfileForm({ displayName }: { displayName: string }) {
  const [state, action] = useActionState(updateProfile, null);
  return (
    <form action={action} className="space-y-3">
      <FormMessage state={state} />
      <div>
        <Label htmlFor="display_name">নাম</Label>
        <Input id="display_name" name="display_name" defaultValue={displayName} className="rounded-lg" required />
      </div>
      <SubmitButton pendingText="সংরক্ষণ হচ্ছে…">সংরক্ষণ করুন</SubmitButton>
    </form>
  );
}

export function AvatarUpload({ url, initial }: { url: string | null; initial: string }) {
  const [preview, setPreview] = useState(url);
  const [state, setState] = useState<FormState>(null);
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<File | null>(null);
  const input = useRef<HTMLInputElement>(null);

  function onPick(picked: File | undefined) {
    if (input.current) input.current.value = "";
    if (!picked) return;
    if (!picked.type.startsWith("image/") && !/\.(heic|heif)$/i.test(picked.name)) {
      setState({ ok: false, message: "অনুগ্রহ করে একটি ছবি (JPG, PNG, WebP) নির্বাচন করুন।" });
      return;
    }
    setState(null);
    setEditing(picked);
  }

  function upload(edited: File) {
    setEditing(null);
    start(async () => {
      const fd = new FormData();
      fd.append("file", edited);
      const res = await updateProfilePhoto(fd);
      if (res.ok) {
        setPreview(res.data.url);
        setState({ ok: true, message: "প্রোফাইল ছবি হালনাগাদ হয়েছে।" });
      } else setState({ ok: false, message: res.error });
    });
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="প্রোফাইল ছবি" className="size-20 rounded-full border-2 border-accent object-cover" />
        ) : (
          <div className="grid size-20 place-items-center rounded-full border-2 border-accent bg-primary text-2xl font-bold text-white">{initial}</div>
        )}
        {pending && (
          <div className="absolute inset-0 grid place-items-center rounded-full bg-black/45">
            <Loader2 className="size-6 animate-spin text-white" aria-label="আপলোড হচ্ছে" />
          </div>
        )}
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={pending}
          className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full bg-accent text-brand-deep shadow hover:bg-accent/90"
          aria-label="প্রোফাইল ছবি পরিবর্তন করুন"
        >
          <Camera className="size-4" />
        </button>
        <input ref={input} type="file" accept="image/*,.heic,.heif" className="hidden" onChange={(e) => onPick(e.target.files?.[0])} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold">প্রোফাইল ছবি</p>
        <p className="text-xs text-muted-foreground">একটি পরিষ্কার ছবি আপলোড করুন। আপলোডের আগে ছবিটি কেটে, ঘুরিয়ে মানানসই করে নিতে পারবেন।</p>
        <button type="button" onClick={() => input.current?.click()} disabled={pending} className="mt-1.5 text-sm font-semibold text-primary hover:underline disabled:opacity-50">
          {pending ? "আপলোড হচ্ছে…" : preview ? "ছবি পরিবর্তন করুন" : "ছবি আপলোড করুন"}
        </button>
        <FormMessage state={state} className="mt-2" />
      </div>
      {editing && <AvatarEditor file={editing} onCancel={() => setEditing(null)} onSave={upload} />}
    </div>
  );
}
