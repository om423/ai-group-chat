"use client"

import * as React from "react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

type ChatShellProps = {
  left: React.ReactNode
  center: React.ReactNode
  right: React.ReactNode
  roomId?: string
  className?: string
}

const DEFAULT_LAYOUT: [number, number, number] = [20, 55, 25] // ~280/792/360 on 1440px
const MIN_LAYOUT: [number, number, number] = [16, 40, 20]     // never let a pane go to 0%

export function ChatShell({ left, center, right, roomId, className }: ChatShellProps) {
  const storageKey = React.useMemo(
    () => `chat-panel-layout-${roomId || "default"}`,
    [roomId]
  )

  const [layout, setLayout] = React.useState<[number, number, number]>(DEFAULT_LAYOUT)
  const [ready, setReady] = React.useState(false)

  // Restore saved layout (percentages) after mount
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as [number, number, number]
        if (Array.isArray(parsed) && parsed.length === 3) setLayout(parsed)
      }
    } catch {}
    setReady(true)
  }, [storageKey])

  const handleLayout = (sizes: number[]) => {
    // react-resizable-panels gives percentages that sum ~100
    const next: [number, number, number] = [sizes[0] ?? 0, sizes[1] ?? 0, sizes[2] ?? 0]
    setLayout(next)
    try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch {}
  }

  // Don't render PanelGroup until after mount to avoid SSR hydration jitter
  if (!ready) {
    return (
      <div className="h-screen bg-background">
        <header className="h-16 border-b border-border bg-card flex items-center px-6">
          <h1 className="text-xl font-semibold text-foreground">AI Chat Platform</h1>
        </header>
        <div className="h-[calc(100vh-4rem)] grid grid-cols-[20%_1fr_25%] gap-3 p-3">
          <aside className="rounded-2xl border border-border bg-card" />
          <main className="rounded-2xl border border-border bg-card" />
          <aside className="rounded-2xl border border-border bg-card" />
        </div>
      </div>
    )
  }

  return (
    <div className={`h-screen bg-background ${className ?? ""}`}>
      {/* Header */}
      <header className="h-16 border-b border-border bg-card flex items-center px-6">
        <h1 className="text-xl font-semibold text-foreground">AI Chat Platform</h1>
      </header>

      {/* Three resizable panes */}
      <div className="h-[calc(100vh-4rem)]">
        <PanelGroup
          direction="horizontal"
          onLayout={handleLayout}
          className="h-full"
          autoSaveId={undefined} // we handle persistence ourselves
        >
          {/* Left */}
          <Panel
            defaultSize={layout[0]}
            minSize={MIN_LAYOUT[0]}
            maxSize={40}
            className="bg-card border-r border-border overflow-hidden"
          >
            <div className="h-full flex flex-col">{left}</div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-border hover:bg-border/80 transition-colors" />

          {/* Center */}
          <Panel
            defaultSize={layout[1]}
            minSize={MIN_LAYOUT[1]}
            className="bg-background overflow-hidden"
          >
            <div className="h-full flex flex-col">{center}</div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-border hover:bg-border/80 transition-colors" />

          {/* Right */}
          <Panel
            defaultSize={layout[2]}
            minSize={MIN_LAYOUT[2]}
            maxSize={50}
            className="bg-card border-l border-border overflow-hidden"
          >
            <div className="h-full flex flex-col">{right}</div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  )
}

export default ChatShell