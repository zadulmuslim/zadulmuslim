"use client";
import { useActionState, useRef, useState, useTransition } from "react";
import { Camera, Loader2 } from "lucide-react";
import { updateProfile } from "@/app/actions/account";
import { updateProfilePhoto } from "@/app/actions/media";
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
  const input = useRef<HTMLInputElement>(null);

  function onPick(file: File | undefined) {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    start(async () => {
      const res = await updateProfilePhoto(fd);
      if (res.ok) {
        setPreview(res.data.url);
        setState({ ok: true, message: "ছবি পরিবর্তন হয়েছে।" });
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
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={pending}
          className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full bg-accent text-brand-deep shadow hover:bg-accent/90"
          aria-label="প্রোফাইল ছবি পরিবর্তন করুন"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
        </button>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onPick(e.target.files?.[0])} />
      </div>
      <div className="flex-1 text-xs text-muted-foreground">
        JPG, PNG বা WebP · সর্বোচ্চ ২ MB
        <FormMessage state={state} className="mt-2" />
      </div>
    </div>
  );
}
