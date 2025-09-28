"use client"

import { useState } from "react"
import { Users, FileText, BarChart3, Bot, Wifi, WifiOff } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FilePanel } from "@/components/FilePanel"
import { SpellPanel } from "@/cedar/components/SpellPanel"
import { cn } from "@/components/ui/utils"

interface RightPanelProps {
  // Socket status
  socketConnected: boolean
  lastRTT: number | null

  // Room and role
  roomId: string | null
  asRole: string
  onRoleChange: (role: string) => void
  onRoomChange: (roomId: string) => void

  // Policy demo controls
  showDemo: boolean
  visibility: "public" | "private"
  onVisibilityChange: (visibility: "public" | "private") => void
  k: number
  onKChange: (k: number) => void
  classification: string
  onClassificationChange: (classification: string) => void
  fileId: string | null

  // Actions
  onUploadChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onAnalyze: () => void
  onLabelInternal: () => void
  onLabelRestricted: () => void
  onCreateThread: () => void
  onSummarize: () => void
  onSendWelcomeBrief: () => void

  // Traces
  traces: any[]
}

export function RightPanel({
  socketConnected,
  lastRTT,
  roomId,
  asRole,
  onRoleChange,
  onRoomChange,
  showDemo,
  visibility,
  onVisibilityChange,
  k,
  onKChange,
  classification,
  onClassificationChange,
  fileId,
  onUploadChange,
  onAnalyze,
  onLabelInternal,
  onLabelRestricted,
  onCreateThread,
  onSummarize,
  onSendWelcomeBrief,
  traces
}: RightPanelProps) {
  const [activeTab, setActiveTab] = useState("participants")

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        {/* Tabs header */}
        <div className="px-4 pt-4">
          <TabsList className="grid grid-cols-4 w-full rounded-2xl border border-border bg-secondary/60 p-1">
            <TabsTrigger
              value="participants"
              className="text-xs rounded-xl data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            >
              <Users className="h-3 w-3 mr-1" />
              People
            </TabsTrigger>
            <TabsTrigger
              value="files"
              className="text-xs rounded-xl data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            >
              <FileText className="h-3 w-3 mr-1" />
              Files
            </TabsTrigger>
            <TabsTrigger
              value="summary"
              className="text-xs rounded-xl data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            >
              <BarChart3 className="h-3 w-3 mr-1" />
              Summary
            </TabsTrigger>
            <TabsTrigger
              value="tools"
              className="text-xs rounded-xl data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            >
              <Bot className="h-3 w-3 mr-1" />
              AI Tools
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          {/* Participants */}
          <TabsContent value="participants" className="h-full m-0 p-4">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                {/* Connection */}
                <Card className="rounded-2xl border-border bg-card/90 shadow-soft">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Connection</CardTitle>
                    <CardDescription className="text-xs">
                      Live socket status for this client
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      {socketConnected ? (
                        <Wifi className="h-4 w-4 text-green-600" />
                      ) : (
                        <WifiOff className="h-4 w-4 text-red-600" />
                      )}
                      <span
                        className={cn(
                          "font-medium",
                          socketConnected ? "text-green-700" : "text-red-700"
                        )}
                      >
                        {socketConnected ? "Connected" : "Disconnected"}
                      </span>
                      {lastRTT !== null && (
                        <span className="text-muted-foreground">• {lastRTT}ms RTT</span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Current User */}
                <Card className="rounded-2xl border-border bg-card/90 shadow-soft">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Current User</CardTitle>
                    <CardDescription className="text-xs">
                      Switch role or room for testing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label htmlFor="role" className="text-xs">Role</Label>
                      <Select value={asRole} onValueChange={onRoleChange}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Teacher">Teacher</SelectItem>
                          <SelectItem value="Student">Student</SelectItem>
                          <SelectItem value="Analyst">Analyst</SelectItem>
                          <SelectItem value="Researcher">Researcher</SelectItem>
                          <SelectItem value="Agent">Agent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="room" className="text-xs">Room</Label>
                      <Input
                        id="room"
                        value={roomId || ""}
                        onChange={(e) => onRoomChange(e.target.value)}
                        className="h-8 text-xs"
                        placeholder="Enter room ID"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Participants List */}
                <Card className="rounded-2xl border-border bg-card/90 shadow-soft">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Participants</CardTitle>
                    <CardDescription className="text-xs">
                      Active users and agents
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-green-600 rounded-full" />
                        <span className="font-medium">{asRole}</span>
                        <span className="text-xs text-muted-foreground">(You)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <span className="font-medium">AI Assistant</span>
                        <span className="text-xs text-muted-foreground">(Agent)</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Files */}
          <TabsContent value="files" className="h-full m-0 p-4">
            <ScrollArea className="h-full">
              <Card className="rounded-2xl border-border bg-card/90 shadow-soft">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Files</CardTitle>
                  <CardDescription className="text-xs">
                    Uploads linked to this room
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FilePanel roomId={roomId || "demo"} asRole={asRole} />
                </CardContent>
              </Card>
            </ScrollArea>
          </TabsContent>

          {/* Summary */}
          <TabsContent value="summary" className="h-full m-0 p-4">
            <ScrollArea className="h-full">
              <Card className="rounded-2xl border-border bg-card/90 shadow-soft">
                <CardHeader>
                  <CardTitle className="text-sm">Thread Summary</CardTitle>
                  <CardDescription className="text-xs">
                    AI-generated overview of the current conversation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    No messages in this thread yet.
                  </div>
                </CardContent>
              </Card>
            </ScrollArea>
          </TabsContent>

          {/* AI Tools */}
          <TabsContent value="tools" className="h-full m-0 p-4">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                {/* Spells */}
                <Card className="rounded-2xl border-border bg-card/90 shadow-soft">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Spells</CardTitle>
                    <CardDescription className="text-xs">
                      Cedar-OS actions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SpellPanel roomId={roomId || "demo"} asRole={asRole} />
                  </CardContent>
                </Card>

                {showDemo && (
                  <>
                    {/* Create Thread */}
                    <Card className="rounded-2xl border-border bg-card/90 shadow-soft">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Create Thread</CardTitle>
                        <CardDescription className="text-xs">
                          Start a new conversation
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label htmlFor="thread-visibility" className="text-xs">Visibility</Label>
                          <Select value={visibility} onValueChange={onVisibilityChange}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="public">Public</SelectItem>
                              <SelectItem value="private">Private</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={onCreateThread} size="sm" className="w-full text-xs button button--primary">
                          Create Thread
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Summarize Window */}
                    <Card className="rounded-2xl border-border bg-card/90 shadow-soft">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Summarize Window</CardTitle>
                        <CardDescription className="text-xs">
                          Summarize the last K messages
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label htmlFor="k-value" className="text-xs">K Value</Label>
                          <Input
                            id="k-value"
                            type="number"
                            value={k}
                            onChange={(e) => onKChange(parseInt(e.target.value || "50", 10))}
                            className="h-8 text-xs"
                          />
                        </div>
                        <Button onClick={onSummarize} size="sm" className="w-full text-xs">
                          Summarize
                        </Button>
                      </CardContent>
                    </Card>

                    {/* File Upload & Analysis */}
                    <Card className="rounded-2xl border-border bg-card/90 shadow-soft">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">File Analysis</CardTitle>
                        <CardDescription className="text-xs">
                          Upload and analyze a file
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label htmlFor="classification" className="text-xs">Classification</Label>
                          <Select value={classification} onValueChange={onClassificationChange}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="public">Public</SelectItem>
                              <SelectItem value="internal">Internal</SelectItem>
                              <SelectItem value="restricted">Restricted</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="file-upload" className="text-xs">File</Label>
                          <Input
                            id="file-upload"
                            type="file"
                            onChange={onUploadChange}
                            className="h-8 text-xs"
                          />
                        </div>
                        <Button
                          onClick={onAnalyze}
                          disabled={!fileId}
                          size="sm"
                          className="w-full text-xs"
                        >
                          Analyze File
                        </Button>
                        {fileId && (
                          <div className="text-xs text-green-700">
                            ✓ File uploaded: {fileId}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Message Labeling */}
                    <Card className="rounded-2xl border-border bg-card/90 shadow-soft">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Message Labeling</CardTitle>
                        <CardDescription className="text-xs">
                          Apply policy-aware labels
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Button onClick={onLabelInternal} size="sm" variant="outline" className="w-full text-xs border-border">
                          Label Internal
                        </Button>
                        <Button onClick={onLabelRestricted} size="sm" variant="outline" className="w-full text-xs border-border">
                          Label Restricted
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Welcome Brief */}
                    <Card className="rounded-2xl border-border bg-card/90 shadow-soft">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Welcome Brief</CardTitle>
                        <CardDescription className="text-xs">
                          Send a room intro
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button onClick={onSendWelcomeBrief} size="sm" className="w-full text-xs button button--primary">
                          Send Welcome Brief
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Realtime Agent Actions */}
                    <Card className="rounded-2xl border-border bg-card/90 shadow-soft">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Agent Actions</CardTitle>
                        <CardDescription className="text-xs">
                          Live policy decisions & traces
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-64">
                          <div className="space-y-2">
                            {traces.slice(0, 10).map((trace, index) => (
                              <div
                                key={index}
                                className={cn(
                                  "p-2 rounded-xl text-xs border",
                                  trace.decision === "Allow"
                                    ? "bg-green-50 border-green-200 text-green-800"
                                    : "bg-red-50 border-red-200 text-red-800"
                                )}
                              >
                                <div className="font-medium">
                                  {trace.action} — {trace.decision}
                                </div>
                                <div className="text-muted-foreground">
                                  {trace.principal?.type} {trace.principal?.id}
                                </div>
                                {trace.reason && (
                                  <div className="text-muted-foreground">
                                    {trace.reason}
                                  </div>
                                )}
                              </div>
                            ))}
                            {traces.length === 0 && (
                              <div className="text-xs text-muted-foreground text-center py-4">
                                No agent actions yet
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}