"use client";
import { Badge } from "./ui/badge";

export function TagBadge({ text }: { text: string }) {
  return (
    <Badge variant="secondary" className="text-xs">
      {text}
    </Badge>
  );
}
