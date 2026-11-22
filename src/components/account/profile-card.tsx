"use client";
import { useActionState, useEffect, useState } from "react";
import { BadgeCheck, Briefcase, CalendarDays, MapPin, Pencil, Phone, X } from "lucide-react";
import { updateProfile } from "@/app/actions/account";
import { AvatarUpload } from "@/components/auth/account-forms";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage } from "@/components/ui/form-message";
import { DISTRICTS } from "@/data/districts";
import { cn, toBnDigits } from "@/lib/utils";

export interface ProfileView {
  name: string;
  email: string | null;
  bio: string | null;
  location: string | null;
  occupation: string | null;
  phone: string | null;
  avatarUrl: string | null;
  roleLabel: string;
  isStaff: boolean;
  emailVerified: boolean;
  joined: string;
}

const DISTRICT_NAMES = [...DISTRICTS].map((d) => d.bn).sort((a, b) => a.localeCompare(b, "bn"));

/** Profile header: view mode by default, edit form only after pressing "সম্পাদনা". */
export function ProfileCard({ p }: { p: ProfileView }) {
  const [editing, setEditing] = useState(false);
  const [state, action] = useActionState(updateProfile, null);
  const [bio, setBio] = useState(p.bio ?? "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (state?.ok) {
      setEditing(false);
      setSaved(true);
      const t = setTimeout(() => setSaved(false), 3500);
      return () => clearTimeout(t);
    }
  }, [state]);

  const joined = new Date(p.joined).toLocaleDateString("bn-BD", { timeZone: "Asia/Dhaka", month: "long", year: "numeric" });

  return (
    <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
      {/* Cover */}
      <div className="hero-pattern relative h-28 sm:h-36">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        {!editing && (
          <button
            type="button"
            onClick={() => { setEditing(true); setSaved(false); }}
            className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-sm font-semibold text-primary shadow-sm transition hover:bg-white"
          >
            <Pencil className="size-3.5" aria-hidden /> প্রোফাইল সম্পাদনা
          </button>
        )}
      </div>

      <div className="px-5 pb-6 sm:px-7">
        <div className="-mt-14 flex flex-wrap items-end justify-between gap-3 sm:-mt-16">
          <AvatarUpload compact url={p.avatarUrl} initial={p.name.charAt(0) || "?"} />
        </div>

        {saved && <FormMessage state={{ ok: true, message: "প্রোফাইল সংরক্ষিত হয়েছে।" }} className="mt-4" />}

        {!editing ? (
          <div className="mt-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">{p.name}</h1>
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", p.isStaff ? "bg-accent/20 text-brand-deep" : "bg-primary/10 text-primary")}>{p.roleLabel}</span>
            </div>
            {p.email && (
              <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                {p.email}
                {p.emailVerified && <BadgeCheck className="size-4 text-primary" aria-label="যাচাইকৃত ইমেইল" />}
              </p>
            )}
            {p.bio ? (
              <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-foreground">{p.bio}</p>
            ) : (
              <button type="button" onClick={() => setEditing(true)} className="mt-3 text-sm text-muted-foreground hover:text-primary">
                + নিজের সম্পর্কে দু-এক লাইন যোগ করুন
              </button>
            )}
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {p.occupation && <li className="flex items-center gap-1.5"><Briefcase className="size-4" aria-hidden />{p.occupation}</li>}
              {p.location && <li className="flex items-center gap-1.5"><MapPin className="size-4" aria-hidden />{p.location}</li>}
              {p.phone && <li className="flex items-center gap-1.5"><Phone className="size-4" aria-hidden />{toBnDigits(p.phone)} <span className="text-xs">(শুধু আপনি দেখবেন)</span></li>}
              <li className="flex items-center gap-1.5"><CalendarDays className="size-4" aria-hidden />সদস্য: {joined} থেকে</li>
            </ul>
          </div>
        ) : (
          <form action={action} className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary">প্রোফাইল সম্পাদনা</h2>
              <button type="button" onClick={() => setEditing(false)} className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted" aria-label="বাতিল">
                <X className="size-5" />
              </button>
            </div>
            <FormMessage state={state && !state.ok ? state : null} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="display_name">নাম <span className="text-destructive">*</span></Label>
                <Input id="display_name" name="display_name" defaultValue={p.name} required minLength={2} maxLength={80} placeholder="আপনার নাম" className="rounded-lg" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="bio">পরিচিতি</Label>
                <textarea
                  id="bio"
                  name="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={300}
                  rows={3}
                  placeholder="নিজের সম্পর্কে সংক্ষেপে লিখুন"
                  className="block w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <p className="mt-1 text-right text-xs text-muted-foreground">{toBnDigits(bio.length)}/৩০০</p>
              </div>
              <div>
                <Label htmlFor="occupation">পেশা</Label>
                <Input id="occupation" name="occupation" defaultValue={p.occupation ?? ""} maxLength={80} placeholder="যেমন: শিক্ষক, শিক্ষার্থী" className="rounded-lg" />
              </div>
              <div>
                <Label htmlFor="location">জেলা / এলাকা</Label>
                <Input id="location" name="location" list="bd-districts" defaultValue={p.location ?? ""} maxLength={80} placeholder="যেমন: ঢাকা" className="rounded-lg" />
                <datalist id="bd-districts">{DISTRICT_NAMES.map((d) => <option key={d} value={d} />)}</datalist>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="phone">মোবাইল নম্বর</Label>
                <Input id="phone" name="phone" type="tel" inputMode="tel" defaultValue={p.phone ?? ""} maxLength={20} placeholder="০১XXXXXXXXX" className="rounded-lg" />
                <p className="mt-1 text-xs text-muted-foreground">ঐচ্ছিক। শুধু আপনি ও প্রয়োজনে আমাদের টিম দেখতে পাবে, অন্য কেউ নয়।</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
              <button type="button" onClick={() => setEditing(false)} className="h-10 rounded-full border px-5 text-sm font-semibold hover:bg-muted">বাতিল</button>
              <SubmitButton pendingText="সংরক্ষণ হচ্ছে…">সংরক্ষণ করুন</SubmitButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
