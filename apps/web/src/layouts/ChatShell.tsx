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
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border/60 bg-card/70 backdrop-blur flex items-center">
          <div className="h-16 w-full max-w-[1600px] mx-auto px-8 flex items-center">
            <h1 className="text-lg font-semibold text-foreground">AI Chat Platform</h1>
          </div>
        </header>
        <div className="h-[calc(100vh-4rem)] px-8 py-6">
          <div className="h-full max-w-[1600px] mx-auto grid grid-cols-[22%_1fr_26%] gap-6">
            <aside className="rounded-3xl border border-border/60 bg-card/70" />
            <main className="rounded-3xl border border-border/60 bg-card/60" />
            <aside className="rounded-3xl border border-border/60 bg-card/70" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-background/95 text-foreground flex flex-col ${className ?? ""}`}>
      {/* Header */}
      <header className="border-b border-border/60 bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/65">
        <div className="h-16 w-full max-w-[1600px] mx-auto px-8 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">AI Chat Platform</h1>
        </div>
      </header>

      {/* Three resizable panes */}
      <div className="flex-1 w-full px-8 py-6">
        <div className="h-[calc(100vh-4.5rem)] max-w-[1600px] mx-auto">
          <div className="h-full rounded-3xl border border-border/60 bg-card/40 backdrop-blur-sm shadow-soft overflow-hidden">
            <PanelGroup
              direction="horizontal"
              onLayout={handleLayout}
              className="h-full"
              autoSaveId={undefined}
            >
              {/* Left */}
              <Panel
                defaultSize={layout[0]}
                minSize={MIN_LAYOUT[0]}
                maxSize={38}
                className="bg-[hsl(var(--chat-sidebar))]/95 border-r border-border/60"
              >
                <div className="h-full flex flex-col">{left}</div>
              </Panel>

              <PanelResizeHandle className="w-px bg-border/70 hover:bg-border/90 transition-colors" />

              {/* Center */}
              <Panel
                defaultSize={layout[1]}
                minSize={MIN_LAYOUT[1]}
                className="bg-background/80"
              >
                <div className="h-full flex flex-col">{center}</div>
              </Panel>

              <PanelResizeHandle className="w-px bg-border/70 hover:bg-border/90 transition-colors" />

              {/* Right */}
              <Panel
                defaultSize={layout[2]}
                minSize={MIN_LAYOUT[2]}
                maxSize={48}
                className="bg-card/80 border-l border-border/60"
              >
                <div className="h-full flex flex-col">{right}</div>
              </Panel>
            </PanelGroup>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatShell
