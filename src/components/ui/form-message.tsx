import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type FormState = { ok?: boolean; message?: string; fieldErrors?: Record<string, string[] | undefined>; redirectTo?: string } | null;

export function FormMessage({ state, className }: { state: FormState; className?: string }) {
  if (!state?.message) return null;
  const Icon = state.ok ? CheckCircle2 : AlertCircle;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={cn(
        "flex items-start gap-2 rounded-lg border px-4 py-3 text-sm",
        state.ok ? "border-primary/30 bg-primary/5 text-primary" : "border-destructive/30 bg-destructive/5 text-destructive",
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      {state.message}
    </p>
  );
}

export function FieldError({ state, name }: { state: FormState; name: string }) {
  const err = state?.fieldErrors?.[name]?.[0];
  return err ? <p className="mt-1 text-xs text-destructive">{err}</p> : null;
}
