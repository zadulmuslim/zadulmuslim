"use client";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "./button";

/** Submit button that disables itself and shows a spinner while its form is pending. */
export function SubmitButton({ children, pendingText, pending: pendingProp, ...props }: ButtonProps & { pendingText?: string; pending?: boolean }) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <Button type="submit" disabled={pending || props.disabled} {...props}>
      {pending && <Loader2 className="animate-spin" aria-hidden />}
      {pending && pendingText ? pendingText : children}
    </Button>
  );
}
