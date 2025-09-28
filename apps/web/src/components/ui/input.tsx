import * as React from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-[15px] placeholder:text-ink-500 focus:ring-2 focus:ring-sage-300 focus:border-sage-400 outline-none",
        className
      )}
      {...props}
    />
  );
}