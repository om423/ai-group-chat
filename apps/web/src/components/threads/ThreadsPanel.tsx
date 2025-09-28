"use client";

import { useState, useMemo } from "react";
import { MessageSquare, Lock, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
// swap to our cn util
import { cn } from "@/lib/cn";

export interface Thread {
  threadId: string;
  roomId: string;
  name: string;
  visibility: "public" | "private";
  createdBy?: string;
  originMessageId?: string;
  originAuthorId?: string;
  originAuthorType?: string;
  originSnippet?: string;
}

interface ThreadsPanelProps {
  rooms: any[];
  currentRoomId: string | null;
  onRoomSelect: (roomId: string) => void;
  threads: Thread[];
  activeThread: Thread | null;
  onThreadSelect: (thread: Thread) => void;
  onCreateThread: (visibility: "public" | "private") => void;
}

export function ThreadsPanel({
  rooms,
  currentRoomId,
  onRoomSelect,
  threads,
  activeThread,
  onThreadSelect,
  onCreateThread,
}: ThreadsPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "public" | "private">("all");

  const filteredThreads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return threads.filter((thread) => {
      const matchesSearch =
        !q ||
        thread.name.toLowerCase().includes(q) ||
        thread.threadId.toLowerCase().includes(q);
      const matchesVisibility = visibilityFilter === "all" || thread.visibility === visibilityFilter;
      return matchesSearch && matchesVisibility;
    });
  }, [threads, searchQuery, visibilityFilter]);

  return (
    <div className="h-full flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b border-border/60 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/70">
        <div className="p-6 pb-5">
          <h2 className="section-title mb-3">
            Threads
          </h2>

          {/* Visibility Filter – segmented pills */}
          <div
            role="tablist"
            aria-label="Thread visibility"
            className="mb-4 grid grid-cols-3 rounded-2xl border border-border/60 bg-[hsl(var(--message-agent))]/40 p-1.5 shadow-soft"
          >
            <Button
              role="tab"
              aria-selected={visibilityFilter === "all"}
              variant="ghost"
              size="sm"
              onClick={() => setVisibilityFilter("all")}
              className={cn(
                "text-xs rounded-xl",
                visibilityFilter === "all" &&
                  "bg-matcha-400 text-white shadow-soft hover:bg-matcha-500"
              )}
            >
              All
            </Button>
            <Button
              role="tab"
              aria-selected={visibilityFilter === "public"}
              variant="ghost"
              size="sm"
              onClick={() => setVisibilityFilter("public")}
              className={cn(
                "text-xs rounded-xl",
                visibilityFilter === "public" &&
                  "bg-matcha-400 text-white shadow-soft hover:bg-matcha-500"
              )}
            >
              Public
            </Button>
            <Button
              role="tab"
              aria-selected={visibilityFilter === "private"}
              variant="ghost"
              size="sm"
              onClick={() => setVisibilityFilter("private")}
              className={cn(
                "text-xs rounded-xl",
                visibilityFilter === "private" &&
                  "bg-matcha-400 text-white shadow-soft hover:bg-matcha-500"
              )}
            >
              Private
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/50" />
            <Input
              placeholder="Search threads…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 input rounded-xl border-border/60 bg-white/85"
              aria-label="Search threads"
            />
          </div>
        </div>

        {/* Rooms quick list */}
        <div className="px-6 pb-4 border-t border-border/60">
          <h3 className="section-title mt-3 mb-2">
            Rooms
          </h3>
          <ScrollArea className="h-28">
            <div className="space-y-2 pr-3">
              {rooms.map((room) => (
                <button
                  key={room.roomId}
                  onClick={() => onRoomSelect(room.roomId)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl text-[15px] transition-colors border border-border/60",
                    room.roomId === currentRoomId
                      ? "bg-matcha-400 text-white border-transparent shadow-soft"
                      : "bg-white/85 text-ink/80 hover:bg-[hsl(var(--hover-user))]"
                  )}
                >
                  {room.name || room.roomId}
                </button>
              ))}
              {rooms.length === 0 && (
                <div className="text-xs text-ink/60 italic py-4">No rooms</div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Create Thread */}
        <div className="px-6 py-4 border-t border-border/60">
          <div className="flex gap-3">
            <Button
              onClick={() => onCreateThread("public")}
              size="sm"
              variant="outline"
              className="flex-1 text-xs rounded-xl border-border/60 hover:bg-[hsl(var(--hover-user))]"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Public
            </Button>
            <Button
              onClick={() => onCreateThread("private")}
              size="sm"
              variant="outline"
              className="flex-1 text-xs rounded-xl border-border/60 hover:bg-[hsl(var(--hover-user))]"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Private
            </Button>
          </div>
        </div>
      </div>

      {/* Threads List */}
      <div className="flex-1">
        <ScrollArea className="h-full">
          <div className="p-6 pb-8">
            <div className="space-y-3">
              {filteredThreads.map((thread) => {
                const active = activeThread?.threadId === thread.threadId;
                return (
                  <button
                    key={thread.threadId}
                    onClick={() => onThreadSelect(thread)}
                    className={cn(
                      "w-full text-left px-5 py-4 rounded-2xl text-[15px] transition-colors flex items-center gap-3 border border-border/60",
                      active
                        ? "bg-matcha-400 text-white border-transparent shadow-soft"
                        : "bg-white/90 text-ink/90 hover:bg-[hsl(var(--hover-user))]"
                    )}
                  >
                    {thread.visibility === "public" ? (
                      <MessageSquare className={cn("h-4 w-4", active ? "opacity-95" : "text-ink/70")} />
                    ) : (
                      <Lock className={cn("h-4 w-4", active ? "opacity-95" : "text-ink/70")} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{thread.name}</div>
                      <div
                        className={cn(
                          "text-[11px] mt-0.5",
                          active ? "text-white/90" : "text-ink/60"
                        )}
                      >
                        ({thread.visibility})
                      </div>
                    </div>
                  </button>
                );
              })}

              {filteredThreads.length === 0 && (
                <div className="text-center text-ink/60 text-sm py-8">
                  {searchQuery ? "No threads found" : "No threads yet"}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
