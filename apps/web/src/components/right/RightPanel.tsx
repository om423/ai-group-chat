"use client";

import { useState } from "react";
import {
  Users,
  FileText,
  BarChart3,
  Bot,
  Wifi,
  WifiOff,
  CheckSquare,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FilePanel } from "@/components/FilePanel";
import { SpellPanel } from "@/cedar/components/SpellPanel";
import { TasksPanel } from "@/components/TasksPanel";
import { cn } from "@/lib/cn";

interface RightPanelProps {
  socketConnected: boolean;
  lastRTT: number | null;
  roomId: string | null;
  asRole: string;
  onRoleChange: (role: string) => void;
  onRoomChange: (roomId: string) => void;
  showDemo: boolean;
  visibility: "public" | "private";
  onVisibilityChange: (visibility: "public" | "private") => void;
  k: number;
  onKChange: (k: number) => void;
  classification: string;
  onClassificationChange: (classification: string) => void;
  fileId: string | null;
  onUploadChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAnalyze: () => void;
  onLabelInternal: () => void;
  onLabelRestricted: () => void;
  onCreateThread: () => void;
  onSummarize: () => void;
  onSendWelcomeBrief: () => void;
  traces: any[];
  currentSummary?: string;
  welcomeBrief?: string;
}

export function RightPanel(props: RightPanelProps) {
  const [activeTab, setActiveTab] = useState("participants");
  const {
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
    traces,
    currentSummary,
    welcomeBrief,
  } = props;

  return (
    <div className="h-full flex flex-col border-l border-border/60 bg-card/75">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        {/* Tabs header */}
        <div className="px-6 pt-5">
          <TabsList className="grid grid-cols-5 w-full rounded-2xl border border-border/60 bg-white/85 shadow-soft p-1.5">
            <TabsTrigger
              value="participants"
              className="text-xs rounded-xl data-[state=active]:bg-matcha-400 data-[state=active]:text-white"
            >
              <Users className="h-3 w-3 mr-1" />
              People
            </TabsTrigger>
            <TabsTrigger
              value="files"
              className="text-xs rounded-xl data-[state=active]:bg-matcha-400 data-[state=active]:text-white"
            >
              <FileText className="h-3 w-3 mr-1" />
              Files
            </TabsTrigger>
            <TabsTrigger
              value="summary"
              className="text-xs rounded-xl data-[state=active]:bg-matcha-400 data-[state=active]:text-white"
            >
              <BarChart3 className="h-3 w-3 mr-1" />
              Summary
            </TabsTrigger>
            <TabsTrigger
              value="tasks"
              className="text-xs rounded-xl data-[state=active]:bg-matcha-400 data-[state=active]:text-white"
            >
              <CheckSquare className="h-3 w-3 mr-1" />
              Tasks
            </TabsTrigger>
            <TabsTrigger
              value="tools"
              className="text-xs rounded-xl data-[state=active]:bg-matcha-400 data-[state=active]:text-white"
            >
              <Bot className="h-3 w-3 mr-1" />
              Spells
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          {/* Participants */}
          <TabsContent value="participants" className="h-full m-0 p-6">
            <ScrollArea className="h-full pr-1">
              <div className="space-y-5">
                {/* Connection */}
                <Card className="rounded-2xl border-border/60 bg-white/90 shadow-soft p-5">
                  <div className="pb-3">
                    <h3 className="text-sm font-semibold">Connection</h3>
                    <p className="text-xs text-ink-500">
                      Live socket status for this client
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm">
                      {socketConnected ? (
                        <Wifi className="h-4 w-4 text-success" />
                      ) : (
                        <WifiOff className="h-4 w-4 text-danger" />
                      )}
                      <span
                        className={cn(
                          "font-medium",
                          socketConnected ? "text-success" : "text-danger"
                        )}
                      >
                        {socketConnected ? "Connected" : "Disconnected"}
                      </span>
                      {lastRTT !== null && (
                        <span className="text-ink-500">• {lastRTT}ms RTT</span>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Current User */}
                <Card className="rounded-2xl border-border/60 bg-white/90 shadow-soft p-5">
                  <div className="pb-3">
                    <h3 className="text-sm font-semibold">Current User</h3>
                    <p className="text-xs text-ink-500">
                      Switch role or room for testing
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="role" className="text-xs">
                        Role
                      </Label>
                      <Select value={asRole} onValueChange={onRoleChange}>
                        <SelectTrigger className="h-10 text-xs rounded-xl border-border/60 bg-white/85">
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
                      <Label htmlFor="room" className="text-xs">
                        Room
                      </Label>
                      <Input
                        id="room"
                        value={roomId || ""}
                        onChange={(e) => onRoomChange(e.target.value)}
                        className="h-10 text-xs rounded-xl border-border/60 bg-white/85"
                        placeholder="Enter room ID"
                      />
                    </div>
                  </div>
                </Card>

                {/* Participants List */}
                <Card className="rounded-2xl border-border/60 bg-white/90 shadow-soft p-5">
                  <div className="pb-3">
                    <h3 className="text-sm font-semibold">Participants</h3>
                    <p className="text-xs text-ink-500">
                      Active users and agents
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-success rounded-full" />
                      <span className="font-medium">{asRole}</span>
                      <span className="text-xs text-ink-500">(You)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-matcha-400 rounded-full" />
                      <span className="font-medium">AI Assistant</span>
                      <span className="text-xs text-ink-500">(Agent)</span>
                    </div>
                  </div>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Files */}
          <TabsContent value="files" className="h-full m-0 p-6">
            <ScrollArea className="h-full">
              <Card className="rounded-2xl border-border/60 bg-white/90 shadow-soft p-4">
                <div className="pb-2">
                  <h3 className="text-sm font-semibold">Files</h3>
                  <p className="text-xs text-ink-500">
                    Uploads linked to this room
                  </p>
                </div>
                <div>
                  <FilePanel roomId={roomId || "demo"} asRole={asRole} />
                </div>
              </Card>
            </ScrollArea>
          </TabsContent>

          {/* Summary */}
          <TabsContent value="summary" className="h-full m-0 p-6">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                {/* Welcome Brief */}
                {welcomeBrief && (
                  <Card className="rounded-2xl border-border/60 bg-white/90 shadow-soft p-4">
                    <div>
                      <h3 className="text-sm font-semibold">Welcome Brief</h3>
                      <p className="text-xs text-ink-500">
                        Personalized overview for your return
                      </p>
                    </div>
                    <div className="mt-4">
                      <div className="text-sm text-ink-800 whitespace-pre-wrap">
                        {welcomeBrief}
                      </div>
                    </div>
                  </Card>
                )}

                {/* Thread Summary */}
                <Card className="rounded-2xl border-border/60 bg-white/90 shadow-soft p-4">
                  <div>
                    <h3 className="text-sm font-semibold">Thread Summary</h3>
                    <p className="text-xs text-ink-500">
                      AI-generated overview of the current conversation
                    </p>
                  </div>
                  <div className="mt-4">
                    {currentSummary ? (
                      <div className="text-sm text-ink-800 whitespace-pre-wrap">
                        {currentSummary}
                      </div>
                    ) : (
                      <div className="text-sm text-ink-500">
                        No summary available yet. Send 10 messages to trigger an automatic summary.
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Tasks */}
          <TabsContent value="tasks" className="h-full m-0 p-6">
            <ScrollArea className="h-full">
              <Card className="rounded-2xl border-border/60 bg-white/90 shadow-soft p-4">
                <div className="pb-2">
                  <h3 className="text-sm font-semibold">My Tasks</h3>
                  <p className="text-xs text-ink-500">
                    Action items assigned to you
                  </p>
                </div>
                <div>
                  <TasksPanel roomId={roomId || "demo"} userId={asRole} />
                </div>
              </Card>
            </ScrollArea>
          </TabsContent>

          {/* Spells */}
          <TabsContent value="tools" className="h-full m-0 p-6">
            <ScrollArea className="h-full">
              <div className="space-y-5">
                <Card className="rounded-2xl border-border/60 bg-white/90 shadow-soft p-5">
                  <div className="pb-3">
                    <h3 className="text-sm font-semibold">Cedar-OS Spells</h3>
                    <p className="text-xs text-ink-500">
                      Interactive AI tools and actions
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="text-sm text-ink-600">
                      <p className="font-medium mb-2">Available Spells:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Right-click messages for radial menu</li>
                        <li>• Select text for AI assistance</li>
                        <li>• Press Q for questioning mode</li>
                      </ul>
                    </div>
                    <div>
                      <SpellPanel roomId={roomId || "demo"} asRole={asRole} />
                    </div>
                  </div>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
