"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageItem } from "./MessageItem";

export interface ChatMsg {
  id: string;
  roomId: string;
  authorType: "User" | "Agent";
  authorId: string;
  text: string;
  ts: number;
  _id?: string;
  labels?: string[];
  meta?: {
    task?: {
      assignedTo?: string;
      done?: boolean;
      dueAt?: string;
    };
  };
}

interface MessageListProps {
  messages: ChatMsg[];
  labelsByMessage: Record<string, { label: string; classification: string }>;
  onForkFromMessage: (message: ChatMsg) => void;
  onLabel: (
    id: string,
    label: string,
    classification: "public" | "internal" | "restricted"
  ) => void;
  onCopyId: (id: string) => void;
}

export function MessageList({
  messages,
  labelsByMessage,
  onForkFromMessage,
  onLabel,
  onCopyId,
}: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isAtBottomRef.current && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Track scroll position
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const isAtBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - 10;
    isAtBottomRef.current = isAtBottom;
  };

  // Group consecutive messages
  const groupedMessages = messages.reduce((groups: ChatMsg[][], message, index) => {
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const timeDiff = prevMessage ? message.ts - prevMessage.ts : 0;
    const isSameAuthor =
      prevMessage &&
      prevMessage.authorId === message.authorId &&
      prevMessage.authorType === message.authorType;
    const isWithinTimeWindow = timeDiff < 3 * 60 * 1000;

    if (isSameAuthor && isWithinTimeWindow && groups.length > 0) {
      groups[groups.length - 1].push(message);
    } else {
      groups.push([message]);
    }
    return groups;
  }, []);

  return (
    <ScrollArea
      ref={scrollAreaRef}
      className="h-full px-10 py-8"
      onScrollCapture={handleScroll}
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        {groupedMessages.map((group, groupIndex) => (
          <div key={groupIndex} className="flex flex-col gap-3">
            {group.map((message, messageIndex) => (
              <MessageItem
                key={message._id || message.id}
                message={message}
                isFirstInGroup={messageIndex === 0}
                isLastInGroup={messageIndex === group.length - 1}
                label={labelsByMessage[message._id || message.id]}
                onForkFromMessage={onForkFromMessage}
                onLabel={onLabel}
                onCopyId={onCopyId}
              />
            ))}
          </div>
        ))}

        {messages.length === 0 && (
          <div className="text-center text-ink-500 italic py-12 text-sm">
            No messages yet. Try asking a question!
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
