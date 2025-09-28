"use client"

import { useState, useMemo } from "react"
import { MessageSquare, Lock, Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/components/ui/utils"

export interface Thread {
  threadId: string
  roomId: string
  name: string
  visibility: "public" | "private"
}

interface ThreadsPanelProps {
  rooms: any[]
  currentRoomId: string | null
  onRoomSelect: (roomId: string) => void
  threads: Thread[]
  activeThread: Thread | null
  onThreadSelect: (thread: Thread) => void
  onCreateThread: (visibility: "public" | "private") => void
}

export function ThreadsPanel({
  rooms,
  currentRoomId,
  onRoomSelect,
  threads,
  activeThread,
  onThreadSelect,
  onCreateThread
}: ThreadsPanelProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "public" | "private">("all")

  // Filter threads based on search and visibility
  const filteredThreads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return threads.filter((thread) => {
      const matchesSearch =
        !q ||
        thread.name.toLowerCase().includes(q) ||
        thread.threadId.toLowerCase().includes(q)
      const matchesVisibility = visibilityFilter === "all" || thread.visibility === visibilityFilter
      return matchesSearch && matchesVisibility
    })
  }, [threads, searchQuery, visibilityFilter])

  return (
    <div className="h-full flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b border-border bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/70">
        <div className="p-4">
          <h2 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Threads
          </h2>

          {/* Visibility Filter – pill segmented control */}
          <div
            role="tablist"
            aria-label="Thread visibility"
            className="mb-3 grid grid-cols-3 rounded-xl border border-border bg-secondary/60 p-1"
          >
            <Button
              role="tab"
              aria-selected={visibilityFilter === "all"}
              variant={visibilityFilter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setVisibilityFilter("all")}
              className={cn(
                "text-xs rounded-lg",
                visibilityFilter === "all" && "button button--primary"
              )}
            >
              All
            </Button>
            <Button
              role="tab"
              aria-selected={visibilityFilter === "public"}
              variant={visibilityFilter === "public" ? "default" : "ghost"}
              size="sm"
              onClick={() => setVisibilityFilter("public")}
              className={cn(
                "text-xs rounded-lg",
                visibilityFilter === "public" && "button button--primary"
              )}
            >
              Public
            </Button>
            <Button
              role="tab"
              aria-selected={visibilityFilter === "private"}
              variant={visibilityFilter === "private" ? "default" : "ghost"}
              size="sm"
              onClick={() => setVisibilityFilter("private")}
              className={cn(
                "text-xs rounded-lg",
                visibilityFilter === "private" && "button button--primary"
              )}
            >
              Private
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search threads…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm rounded-xl bg-background border-border focus-visible:ring-ring"
              aria-label="Search threads"
            />
          </div>
        </div>

        {/* Rooms quick list */}
        <div className="px-4 pb-3 border-t border-border">
          <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-3 mb-2">
            Rooms
          </h3>
          <ScrollArea className="h-28">
            <div className="space-y-1 pr-2">
              {rooms.map((room) => (
                <button
                  key={room.roomId}
                  onClick={() => onRoomSelect(room.roomId)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-xl text-sm transition-colors",
                    room.roomId === currentRoomId
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {room.name || room.roomId}
                </button>
              ))}
              {rooms.length === 0 && (
                <div className="text-xs text-muted-foreground italic py-4">
                  No rooms
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Create Thread */}
        <div className="px-4 py-3 border-t border-border">
          <div className="flex gap-2">
            <Button
              onClick={() => onCreateThread("public")}
              size="sm"
              variant="outline"
              className="flex-1 text-xs rounded-xl border-border hover:bg-accent/50 hover:text-accent-foreground"
            >
              <Plus className="h-3 w-3 mr-1" />
              Public
            </Button>
            <Button
              onClick={() => onCreateThread("private")}
              size="sm"
              variant="outline"
              className="flex-1 text-xs rounded-xl border-border hover:bg-accent/50 hover:text-accent-foreground"
            >
              <Plus className="h-3 w-3 mr-1" />
              Private
            </Button>
          </div>
        </div>
      </div>

      {/* Threads List */}
      <div className="flex-1">
        <ScrollArea className="h-full">
          <div className="p-3">
            <div className="space-y-1.5">
              {filteredThreads.map((thread) => {
                const active = activeThread?.threadId === thread.threadId
                return (
                  <button
                    key={thread.threadId}
                    onClick={() => onThreadSelect(thread)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-xl text-sm transition-colors flex items-center gap-2 border",
                      active
                        ? "bg-primary text-primary-foreground border-transparent shadow-soft"
                        : "bg-card/70 text-foreground/90 border-border hover:bg-accent/40"
                    )}
                  >
                    {thread.visibility === "public" ? (
                      <MessageSquare className="h-4 w-4 opacity-90" />
                    ) : (
                      <Lock className="h-4 w-4 opacity-90" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{thread.name}</div>
                      <div className={cn("text-[11px] opacity-75", active ? "text-primary-foreground/90" : "text-muted-foreground")}>
                        ({thread.visibility})
                      </div>
                    </div>
                  </button>
                )
              })}

              {filteredThreads.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  {searchQuery ? "No threads found" : "No threads yet"}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}