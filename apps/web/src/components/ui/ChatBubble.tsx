import * as React from "react";
import { cn } from "@/lib/cn";

type Role = "user" | "agent" | "system";

export function ChatBubble({
  role,
  children,
  className,
}: { role: Role; children: React.ReactNode; className?: string }) {
  const base = "max-w-[78%] md:max-w-[70%] px-4 py-3 rounded-2xl text-[15px] leading-6 shadow-soft";
  const style =
    role === "user"
      ? "bg-sand-50 border border-[var(--border)] text-ink rounded-tr-md"
      : role === "agent"
      ? "bg-sage-100 text-ink rounded-tl-md"
      : "bg-white border border-[var(--border)] text-ink-muted rounded-xl";
  return <div className={cn(base, style, className)}>{children}</div>;
}
