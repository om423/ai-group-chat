"use client";

import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Bot, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MessageActions } from "@/components/MessageActions";
import { TagBadge } from "@/components/TagBadge";
import { cn } from "@/lib/cn";
import { ChatMsg } from "./MessageList";

interface MessageItemProps {
  message: ChatMsg;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  label?: { label: string; classification: string };
  onForkFromMessage: (message: ChatMsg) => void;
  onLabel: (id: string, label: string, classification: "public" | "internal" | "restricted") => void;
  onCopyId: (id: string) => void;
}

export function MessageItem({
  message,
  isFirstInGroup,
  isLastInGroup,
  label,
  onForkFromMessage,
  onLabel,
  onCopyId,
}: MessageItemProps) {
  const isAgent = message.authorType === "Agent";
  const isSystem = message.text.startsWith("Fork here") || message.text.includes("→ forked from");

  const getInitials = (authorId: string) =>
    isAgent
      ? "AI"
      : authorId
          ?.split(/[\s\-_]/)
          .filter(Boolean)
          .map((p) => p[0]?.toUpperCase())
          .slice(0, 2)
          .join("") || "U";

  const avatarClass = isAgent
    ? "bg-matcha-400 text-white"
    : "bg-creme-100 text-ink-800";

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <Badge
          className="text-[11px] tracking-wide uppercase bg-[hsl(var(--message-system))] text-muted-foreground border border-border/70 rounded-full px-3 py-1"
        >
          <MessageSquare className="h-3 w-3 mr-1.5" />
          {message.text}
        </Badge>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-5 group", isFirstInGroup ? "mt-6" : "mt-3")}>
      {/* Avatar (first in group only) */}
      {isFirstInGroup ? (
        <div
          className={cn(
            "mt-1 w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 shadow-soft",
            avatarClass
          )}
          aria-hidden
        >
          {isAgent ? <Bot className="h-4 w-4" /> : <span>{getInitials(message.authorId)}</span>}
        </div>
      ) : (
        <div className="w-10" aria-hidden />
      )}

      {/* Message column */}
      <div className="flex-1 min-w-0">
        {/* Header row (only on first in group) */}
        {isFirstInGroup && (
          <div className="flex items-center gap-4 mb-2">
            <span className={cn("text-sm font-semibold", isAgent ? "text-matcha-600" : "text-ink-800")}>
              {isAgent ? "AI Assistant" : message.authorId}
            </span>
            <span className="text-[11px] text-ink-500">{format(new Date(message.ts), "HH:mm")}</span>
            {label && (
              <span className="inline-flex">
                <TagBadge text={label.label} />
              </span>
            )}
          </div>
        )}

        {/* Bubble */}
        <Card
          className={cn(
            "relative px-5 py-4 max-w-[min(72ch,85%)] rounded-3xl border border-border/60 cursor-pointer transition-transform duration-200 shadow-[var(--shadow-message)] hover:-translate-y-[1px]",
            isAgent
              ? "bg-[hsl(var(--message-agent))]"
              : "bg-[hsl(var(--message-user))]"
          )}
          onContextMenu={(e) => {
            e.preventDefault();
            const rect = e.currentTarget.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            console.log('[MessageItem] Right-click detected, dispatching event:', {
              x,
              y,
              messageId: message._id || message.id,
              text: message.text
            });
            
            // Dispatch custom event to open radial menu
            window.dispatchEvent(new CustomEvent("spell:messageRadialOpen", {
              detail: {
                x,
                y,
                messageId: message._id || message.id,
                text: message.text,
                authorId: message.authorId,
                authorType: message.authorType
              }
            }));
          }}
        >
          {/* Decorative tail */}
          <span
            className={cn(
              "pointer-events-none absolute -left-3 top-5 h-4 w-4 rounded-sm rotate-45 border border-border/60",
              isAgent ? "bg-[hsl(var(--message-agent))]" : "bg-[hsl(var(--message-user))]"
            )}
            aria-hidden
          />

          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                code: ({ className, children, ...props }: any) => {
                  const isInline = !className?.includes("language-");
                  if (isInline) {
                    return (
                      <code className="bg-matcha-100 px-1 py-0.5 rounded text-[12px]" {...props}>
                        {children}
                      </code>
                    );
                  }
                  return (
                    <pre className="bg-matcha-50 p-2 rounded-xl text-[12px] overflow-x-auto border border-[var(--border)]">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  );
                },
                a: ({ children, ...props }) => (
                  <a className="underline decoration-from-font hover:opacity-80" {...props}>
                    {children}
                  </a>
                ),
                p: ({ children }) => <p className="leading-6">{children}</p>,
                ul: ({ children }) => <ul className="mt-1">{children}</ul>,
                ol: ({ children }) => <ol className="mt-1">{children}</ol>,
              }}
            >
              {message.text}
            </ReactMarkdown>
          </div>
        </Card>

        {/* Labels and Task Badge */}
        <div className="flex items-center gap-2 mt-2">
          {(message.labels ?? []).map((lab: string) => (
            <span key={lab} className="text-[10px] px-2 py-[2px] rounded-full border uppercase opacity-80">
              {lab}
            </span>
          ))}
          {message.meta?.task?.assignedTo ? (
            <span className={`text-[10px] px-2 py-[2px] rounded-full border ${message.meta.task.done ? "opacity-50 line-through" : ""}`}>
              Task → {message.meta.task.assignedTo}{message.meta.task.dueAt ? ` • due ${new Date(message.meta.task.dueAt).toLocaleDateString()}` : ""}
            </span>
          ) : null}
        </div>

        {/* Actions (show only on last in group) */}
        {isLastInGroup && (
          <div className="flex items-center gap-3 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onForkFromMessage(message)}
              className="text-xs h-6 px-2 border-border/70"
            >
              Fork here
            </Button>
            <MessageActions
              onFork={() => onForkFromMessage(message)}
              onLabel={(l, c) => onLabel(message._id || (message as any).id, l, c)}
              onCopy={() => onCopyId(message._id || (message as any).id)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
