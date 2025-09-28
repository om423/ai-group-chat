"use client"

import { format } from "date-fns"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import { Bot, User as UserIcon, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { MessageActions } from "@/components/MessageActions"
import { TagBadge } from "@/components/TagBadge"
import { cn } from "@/components/ui/utils"
import { ChatMsg } from "./MessageList"

interface MessageItemProps {
  message: ChatMsg
  isFirstInGroup: boolean
  isLastInGroup: boolean
  label?: { label: string; classification: string }
  onForkFromMessage: (msgId: string) => void
  onLabel: (id: string, label: string, classification: "public" | "internal" | "restricted") => void
  onCopyId: (id: string) => void
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
  const isAgent = message.authorType === "Agent"
  const isSystem =
    message.text.startsWith("Fork here") || message.text.includes("→ forked from")

  // Derive initials for non-agent authors
  const getInitials = (authorId: string) => {
    if (isAgent) return "AI"
    return authorId
      ?.split(/[\s\-_]/)
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || "U"
  }

  // Avatar classes by role (muted green theme)
  const avatarClass = isAgent
    ? "bg-primary text-primary-foreground"
    : "bg-muted text-foreground/80"

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <Badge
          variant="secondary"
          className="text-[11px] tracking-wide uppercase bg-secondary text-secondary-foreground border border-border rounded-full px-3 py-1"
        >
          <MessageSquare className="h-3 w-3 mr-1.5" />
          {message.text}
        </Badge>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex gap-3 group",
        isFirstInGroup ? "mt-4" : "mt-1"
      )}
    >
      {/* Avatar (first in group only) */}
      {isFirstInGroup ? (
        <div
          className={cn(
            "mt-0.5 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 shadow-sm",
            avatarClass
          )}
          aria-hidden
        >
          {isAgent ? (
            <Bot className="h-4 w-4" />
          ) : (
            <span>{getInitials(message.authorId)}</span>
          )}
        </div>
      ) : (
        // Spacer when grouped
        <div className="w-8" aria-hidden />
      )}

      {/* Message column */}
      <div className="flex-1 min-w-0">
        {/* Header row (only on first in group) */}
        {isFirstInGroup && (
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                "text-sm font-semibold",
                isAgent ? "text-primary" : "text-foreground"
              )}
            >
              {isAgent ? "AI Assistant" : message.authorId}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {format(new Date(message.ts), "HH:mm")}
            </span>
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
            "relative p-3 max-w-[min(78ch,80%)] shadow-soft",
            "rounded-2xl border",
            isAgent
              ? "bg-[var(--ai-message-bg)]/90 border-border"
              : "bg-[var(--user-message-bg)]/90 border-border"
          )}
        >
          {/* Optional tiny tail (purely decorative) */}
          <span
            className={cn(
              "pointer-events-none absolute -left-2 top-3 h-3 w-3 rounded-sm rotate-45 border border-border",
              isAgent
                ? "bg-[var(--ai-message-bg)]/90"
                : "bg-[var(--user-message-bg)]/90"
            )}
            aria-hidden
          />

          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                code: ({ className, children, ...props }: any) => {
                  const isInline = !className?.includes("language-")
                  if (isInline) {
                    return (
                      <code
                        className="bg-muted px-1 py-0.5 rounded text-[12px]"
                        {...props}
                      >
                        {children}
                      </code>
                    )
                  }
                  return (
                    <pre className="bg-muted p-2 rounded-xl text-[12px] overflow-x-auto border border-border">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  )
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

        {/* Actions (show only on last in group) */}
        {isLastInGroup && (
          <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onForkFromMessage(message._id || message.id)}
              className="text-xs h-6 px-2 border-border"
            >
              Fork here
            </Button>
            <MessageActions
              onFork={() => onForkFromMessage(message._id || message.id)}
              onLabel={(l, c) => onLabel(message._id || message.id, l, c)}
              onCopy={() => onCopyId(message._id || message.id)}
            />
          </div>
        )}
      </div>
    </div>
  )
}