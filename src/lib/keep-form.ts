"use client";
import { startTransition, type FormEvent } from "react";

/**
 * Submits a form to a useActionState action without React's automatic form
 * reset, so typed values survive a validation or captcha error.
 * Keep `action={action}` on the form as well: it is the no-JavaScript fallback.
 */
export function keepValues(action: (fd: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };
}
