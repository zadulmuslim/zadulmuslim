"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Password field with a show/hide toggle. */
export function PasswordInput({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  const [shown, setShown] = useState(false);
  const Icon = shown ? EyeOff : Eye;
  return (
    <div className="relative">
      <Input {...props} type={shown ? "text" : "password"} autoCapitalize="none" autoCorrect="off" spellCheck={false} className={cn("pr-12", className)} />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
        aria-pressed={shown}
        aria-controls={props.id}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icon className="size-[18px]" aria-hidden />
      </button>
    </div>
  );
}
