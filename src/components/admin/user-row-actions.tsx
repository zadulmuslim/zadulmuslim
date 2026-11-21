"use client";
import { useActionState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { deleteUser, setUserRole } from "@/app/actions/admin/users";
import { NativeSelect } from "@/components/ui/native-select";
import { SubmitButton } from "@/components/ui/submit-button";
import { ROLE_LABEL_BN, type UserRole } from "@/lib/storage/categories";

function DeleteBtn({ name }: { name: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!confirm(`"${name}"-কে স্থায়ীভাবে মুছে ফেলবেন? তাঁর অ্যাকাউন্ট আর ফেরত আনা যাবে না। (তাঁর লেখা প্রবন্ধ ও প্রশ্নোত্তর থেকে যাবে।)`)) e.preventDefault();
      }}
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/5 disabled:opacity-50"
      aria-label="ব্যবহারকারী মুছুন"
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
      মুছুন
    </button>
  );
}

export function UserRowActions({
  id,
  name,
  role,
  assignable,
  manageable,
}: {
  id: string;
  name: string;
  role: UserRole;
  assignable: UserRole[];
  manageable: boolean;
}) {
  const [roleState, roleAction] = useActionState(setUserRole, null);
  const [delState, delAction] = useActionState(deleteUser, null);
  const msg = delState?.message ?? roleState?.message;
  const ok = delState ? delState.ok : roleState?.ok;

  if (!manageable) {
    return <span className="text-xs text-muted-foreground">{ROLE_LABEL_BN[role]}</span>;
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={roleAction} className="flex items-center gap-2">
        <input type="hidden" name="id" value={id} />
        <NativeSelect name="role" defaultValue={role} className="h-9 w-32" aria-label="ভূমিকা">
          {assignable.map((r) => (
            <option key={r} value={r}>{ROLE_LABEL_BN[r]}</option>
          ))}
        </NativeSelect>
        <SubmitButton size="sm" variant="outline" pendingText="…">সংরক্ষণ</SubmitButton>
      </form>
      <form action={delAction}>
        <input type="hidden" name="id" value={id} />
        <DeleteBtn name={name} />
      </form>
      {msg && <span className={`w-full text-xs ${ok ? "text-primary" : "text-destructive"}`}>{msg}</span>}
    </div>
  );
}
