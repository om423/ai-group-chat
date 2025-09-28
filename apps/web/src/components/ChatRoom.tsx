"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { io } from "socket.io-client";
import { sendChatMessage } from "@/lib/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { SpellPalette } from "@/components/SpellPalette";
import { runSpell } from "@/cedar/runSpell";
import type { Spell } from "@/cedar/spells";
import { onActionResult, runAgenticAction } from "@/cedar/actionAdapter";
import type { AgenticResult } from "@/cedar/actions";
import { RadialMessageMenu } from "@/components/spells/RadialMessageMenu";
import { SelectionTooltip } from "@/components/spells/SelectionTooltip";
import { QuestioningMode } from "@/components/spells/QuestioningMode";
import { SpellsMenu } from "@/components/spells/SpellsMenu";

const AGENT_BASE = process.env.NEXT_PUBLIC_MASTRA_BASE_URL || "http://localhost:4111";

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  type: "user" | "ai";
  name: string;
  agent?: string;
  toolUsed?: string;
}

interface ChatRoomProps {
  roomId: string;
  onLogout?: () => void;
}

export default function ChatRoom({ roomId, onLogout }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [asRole, setAsRole] = useState("Student");
  const [selectedAgent, setSelectedAgent] = useState("generalHelper");
  const [radialTarget, setRadialTarget] = useState<{ messageId: string; text: string } | null>(null);
  const [currentSummary, setCurrentSummary] = useState<string>("");
  const [welcomeBrief, setWelcomeBrief] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const agents = {
    generalHelper: { name: "General Helper", description: "Can help with weather, files, and code analysis" },
    mcpAgent: { name: "MCP Agent", description: "Uses tools from MCP servers" },
    codingAssistant: { name: "Coding Assistant", description: "Specialized in code analysis and development" },
    weatherSpecialist: { name: "Weather Specialist", description: "Expert in weather information" },
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);

  // When user double-clicks a message bubble, open the spell UI at cursor position
  const onMessageDoubleClick = (e: React.MouseEvent, msg: Message) => {
    e.preventDefault();
    setRadialTarget({ messageId: msg.id, text: msg.content });
    window.dispatchEvent(new CustomEvent("spell:messageRadialOpen", {
      detail: { x: e.clientX, y: e.clientY, messageId: msg.id, text: msg.content }
    }));
  };

  // Spell runner that provides minimal, safe behavior now
  const handleRunSpell = (spell: Spell) => {
    // Broadcast temporary event (will be replaced with real adapter in Step 2)
    runSpell(spell, { roomId });

    // Helpful UI-only behaviors:
    if (spell.id === "askAI") {
      // Prefill the composer with '/ai ' if not already
      setDraft((d) => (d.startsWith("/ai ") ? d : `/ai ${d}`));
    }

    // For other spells, just log for now. Step 2 will wire to real actions.
    console.log("[Spell]", spell.id, "dispatched for room:", roomId);
  };

  // Socket connection for real-time messages
  useEffect(() => {
    const socket = io(AGENT_BASE, { transports: ["websocket"] });
    socket.on("chat:message", (msg: any) => {
      const newMessage: Message = {
        id: msg.id,
        content: msg.text,
        timestamp: new Date(msg.ts),
        type: msg.authorType === "Agent" ? "ai" : "user",
        name: msg.authorType === "Agent" ? "AI Assistant" : msg.authorId
      };
      setMessages(prev => [...prev, newMessage]);
      setIsAIThinking(false);
    });

    socket.on("agent:message", (msg: any) => {
      const newMessage: Message = {
        id: `a_${msg.ts}`,
        content: msg.text,
        timestamp: new Date(msg.ts),
        type: "ai",
        name: "AI Assistant"
      };
      setMessages(prev => [...prev, newMessage]);
      setIsAIThinking(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Action result listener
  useEffect(() => {
    const off = onActionResult((res: AgenticResult) => {
      // Minimal UI reactions (replace with your real state handlers):
      if (!res.ok) {
        console.warn("[Action FAILED]", res.action.type, res.error, res.pdp);
        return;
      }
      console.log("[Action OK]", res.action.type, res.data, res.pdp);

      // Example optimistic handlers:
      switch (res.action.type) {
        case "openFork":
          // show the new thread in left pane if server returns it
          console.log("New thread created:", res.data);
          break;
        case "postSummary":
          // update summary tab
          console.log("Summary posted:", res.data);
          break;
        case "tagMessage":
          // attach a label badge to message
          console.log("Message tagged:", res.action.messageId, res.action.label);
          break;
        case "summarizeWindow":
          // update summary tab
          console.log("Window summarized:", res.data);
          if (res.data?.summary) {
            setCurrentSummary(res.data.summary);
          }
          break;
        case "analyzeFile":
          // append a doc analysis message
          console.log("File analyzed:", res.data);
          break;
        case "askAI":
          console.log("AI prompt:", res.data);
          break;
        case "inviteUser":
          console.log("User invited:", res.data);
          break;
        case "welcomeBrief":
          console.log("Welcome brief generated:", res.data);
          if (res.data?.brief) {
            setWelcomeBrief(res.data.brief);
          }
          break;
      }
    });
    return () => { /* Socket handler removed by onActionResult rebind */ };
  }, []);

  // Trigger welcome brief when room opens
  useEffect(() => {
    const userId = "demo-user"; // In a real app, get from auth/session
    const kMessages = Number(process.env.NEXT_PUBLIC_WELCOME_BRIEF_K ?? 40);
    
    // Fire welcome brief on room open
    runAgenticAction({ 
      type: "welcomeBrief", 
      roomId, 
      userId, 
      kMessages 
    });
  }, [roomId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: draft.trim(),
      timestamp: new Date(),
      type: "user",
      name: "You"
    };

    setMessages(prev => [...prev, userMessage]);
    setDraft("");
    setIsSending(true);
    setIsAIThinking(true);

    try {
      await sendChatMessage(roomId, userMessage.content, asRole);
    } catch (error: any) {
      console.error("Failed to send message:", error);
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp: Date) =>
    timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const isAIMessage = (m: Message) => m.type === "ai";

  return (
    <div className="h-screen bg-matcha-50/50 flex flex-col">
      <SpellPalette onRun={handleRunSpell} />
      {/* Header */}
      <header className="bg-white/90 backdrop-blur border-b border-[var(--border)] shadow-soft">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-lg md:text-xl font-semibold text-ink-800">
                AI Chat — <span className="text-ink-500">{roomId}</span>
              </h1>
              <div className="flex items-center gap-2">
                <label htmlFor="agent-select" className="text-sm text-ink-500">Agent:</label>
                <select
                  id="agent-select"
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="input h-9 rounded-xl"
                >
                  {Object.entries(agents).map(([key, agent]) => (
                    <option key={key} value={key}>{agent.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-ink-500">Role:</label>
                <select
                  value={asRole}
                  onChange={(e) => setAsRole(e.target.value)}
                  className="input h-9 rounded-xl"
                >
                  <option value="Student">Student</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Analyst">Analyst</option>
                  <option value="Researcher">Researcher</option>
                  <option value="Agent">Agent</option>
                </select>
              </div>
              <div className="flex items-center gap-2 text-sm text-ink-500">
                <div className="w-2 h-2 bg-success rounded-full" />
                <span>Connected</span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="text-ink-500 hover:text-ink-800 transition-colors"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Messages */}
        <div 
          className="flex-1 overflow-y-auto px-8 py-8 md:py-10 min-h-0"
          data-question="This is the conversation. Select text to see the selection spell."
        >
          {messages.length === 0 ? (
            <div className="text-center text-ink-500 mt-20">
              <div className="w-12 h-12 bg-matcha-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-ink-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-ink-800">No messages yet</p>
              <p className="text-xs text-ink-500 mt-1">Start the conversation</p>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {messages.map((m) => {
                  const currentUser = m.type === "user";
                  return (
                    <div 
                      key={m.id} 
                      className="flex items-start gap-4"
                      onDoubleClick={(e) => onMessageDoubleClick(e, m)}
                      data-question={m.type === "ai" ? "AI message. Use Q to see hints." : "User message. Double-click for actions."}
                    >
                      {/* Avatar */}
                      <div
                        className={[
                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-soft",
                          currentUser ? "bg-matcha-400 text-white" : "bg-matcha-100 text-ink-800",
                        ].join(" ")}
                      >
                        <span className="text-sm font-medium">
                          {m.name.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      {/* Message Content */}
                      <div className="flex-1 min-w-0">
                        {/* Name / badges / time */}
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-semibold text-ink-800">
                            {m.name}
                          </span>
                          {m.agent && (
                            <span className="text-xs px-2 py-1 bg-matcha-100 text-ink-800 rounded-full">
                              {agents[m.agent as keyof typeof agents]?.name}
                            </span>
                          )}
                          {m.toolUsed && (
                            <span className="text-xs px-2 py-1 bg-creme-100 text-ink-800 rounded-full">
                              🔧 {m.toolUsed}
                            </span>
                          )}
                          <span className="text-xs text-ink-500">
                            {formatTime(m.timestamp)}
                          </span>
                        </div>

                        {/* Bubble */}
                        <Card
                          className={[
                            "max-w-2xl px-5 py-4 rounded-2xl border shadow-soft",
                            isAIMessage(m) ? "bg-matcha-100 border-[var(--border)]" : "bg-matcha-400 text-white border-transparent",
                          ].join(" ")}
                        >
                          <div className={isAIMessage(m)
                            ? "prose prose-sm max-w-none dark:prose-invert"
                            : ""}>
                            {isAIMessage(m) ? (
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  h1: ({ children }) => <h1 className="text-xl font-bold mb-4 text-ink-800 border-b border-[var(--border)] pb-2">{children}</h1>,
                                  h2: ({ children }) => <h2 className="text-lg font-semibold mb-3 text-ink-800 mt-6 first:mt-0">{children}</h2>,
                                  h3: ({ children }) => <h3 className="text-base font-semibold mb-2 text-ink-800 mt-4 first:mt-0">{children}</h3>,
                                  p:  ({ children }) => <p className="mb-4 last:mb-0 leading-6 text-ink-800">{children}</p>,
                                  code: ({ children }) => (
                                    <code className="bg-matcha-50 text-ink-800 px-1.5 py-0.5 rounded text-xs font-mono border border-[var(--border)]">
                                      {children}
                                    </code>
                                  ),
                                  pre: ({ children }) => (
                                    <pre className="bg-ink-900 text-ink-50 p-4 rounded-xl text-sm font-mono overflow-x-auto mb-4 border border-ink-800">
                                      {children}
                                    </pre>
                                  ),
                                  blockquote: ({ children }) => (
                                    <blockquote className="border-l-4 border-matcha-300 bg-matcha-50 pl-4 py-2 italic mb-4 rounded-r-xl text-ink-800">
                                      {children}
                                    </blockquote>
                                  ),
                                  strong: ({ children }) => <strong className="font-semibold text-ink-800">{children}</strong>,
                                  em: ({ children }) => <em className="italic text-ink-800">{children}</em>,
                                  a: ({ children, href }) => (
                                    <a href={href} className="text-matcha-600 underline hover:opacity-80" target="_blank" rel="noopener noreferrer">
                                      {children}
                                    </a>
                                  ),
                                }}
                              >
                                {m.content}
                              </ReactMarkdown>
                            ) : (
                              m.content
                            )}
                          </div>

                          {/* Timestamp */}
                          <div
                            className={[
                              "text-xs mt-3 pt-2 border-t",
                              isAIMessage(m) ? "text-ink-500 border-[var(--border)]" : "text-white/80 border-white/30",
                            ].join(" ")}
                          >
                            {formatTime(m.timestamp)}
                          </div>
                        </Card>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Auto-scroll anchor */}
              <div ref={messagesEndRef} />

              {/* AI Thinking Indicator */}
              {isAIThinking && (
                <div className="flex justify-start mt-4">
                  <div className="max-w-xs lg:max-w-md px-4 py-4 rounded-2xl bg-matcha-50 border border-[var(--border)] shadow-soft">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative">
                        <div className="w-8 h-8 bg-matcha-400 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full animate-pulse" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-ink-800">AI Assistant</span>
                          <span className="text-xs px-2 py-1 rounded-full bg-matcha-100 text-ink-800">Thinking</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-matcha-400 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-matcha-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                            <div className="w-1.5 h-1.5 bg-matcha-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                          </div>
                          <span className="text-xs text-ink-500 font-medium">Processing...</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-matcha-400 rounded-full animate-pulse"></div>
                        <span className="text-sm text-ink-800">Analyzing your message...</span>
                      </div>
                      <div className="w-full bg-matcha-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full rounded-full bg-matcha-400 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Composer */}
        <div className="bg-white/90 backdrop-blur border-t border-[var(--border)] p-6 flex-shrink-0">
          <form onSubmit={handleSendMessage} className="relative">
            <div className="flex items-center bg-white rounded-2xl border border-[var(--border)] focus-within:ring-2 focus-within:ring-matcha-300 focus-within:border-matcha-400 shadow-soft">
              <Input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Message… (⌘/Ctrl-K for commands)"
                className="flex-1 h-14 border-0 focus:outline-none focus:ring-0 rounded-2xl"
                autoFocus
                disabled={isSending}
              />
              <Button
                type="submit"
                disabled={!draft.trim() || isSending}
                className="m-1 h-12 px-6 rounded-xl bg-matcha-400 text-white hover:shadow-lift disabled:opacity-60"
                aria-label={isSending ? "Sending…" : "Send message"}
              >
                {isSending ? "…" : "Send"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Spells (floating) */}
      <RadialMessageMenu roomId={roomId} target={radialTarget} />
      <SelectionTooltip roomId={roomId} />
      <QuestioningMode />
      <SpellsMenu roomId={roomId} />
    </div>
  );
}