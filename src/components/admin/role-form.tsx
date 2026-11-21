"use client";
import { useActionState } from "react";
import { setUserRole } from "@/app/actions/admin/users";
import { NativeSelect } from "@/components/ui/native-select";
import { SubmitButton } from "@/components/ui/submit-button";

export function RoleForm({ id, role, isSelf }: { id: string; role: string; isSelf: boolean }) {
  const [state, action] = useActionState(setUserRole, null);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <NativeSelect name="role" defaultValue={role} className="h-9 w-32" aria-label="ভূমিকা" disabled={isSelf}>
        <option value="member">সদস্য</option>
        <option value="editor">সম্পাদক</option>
        <option value="admin">অ্যাডমিন</option>
      </NativeSelect>
      {!isSelf && <SubmitButton size="sm" variant="outline" pendingText="…">সংরক্ষণ</SubmitButton>}
      {state?.message && <span className={`text-xs ${state.ok ? "text-primary" : "text-destructive"}`}>{state.message}</span>}
    </form>
  );
}
