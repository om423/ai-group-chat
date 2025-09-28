"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { createThread, summarizeWindow, uploadFile, analyzeFile, labelMessage } from "@/agentic/actions";
import { setTeacherPresent, resetTraces, resetMessages, fetchRooms, fetchHistory } from "@/lib/api";
import { sendChatMessage } from "@/lib/chat";
import { listThreads, createThread as createThreadHelper, fetchThreadHistory, sendThreadMessage, ThreadMetadata } from "@/lib/threads";
import { runAgenticAction, runMastraAction } from "@/cedar/actionAdapter";
import LoginForm from "@/components/LoginForm";
import HomePage from "@/components/HomePage";
import { labelMessage as labelMessageAction } from "@/agentic/actions";
import { ChatShell } from "@/layouts/ChatShell";
import { ThreadsPanel, Thread } from "@/components/threads/ThreadsPanel";
import { MessageList, ChatMsg } from "@/components/chat/MessageList";
import { Composer } from "@/components/chat/Composer";
import { RightPanel } from "@/components/right/RightPanel";
import { RadialMessageMenu } from "@/components/spells/RadialMessageMenu";
import { SpellsMenu } from "@/components/spells/SpellsMenu";
import { SelectionTooltip } from "@/components/spells/SelectionTooltip";
import { QuestioningMode } from "@/components/spells/QuestioningMode";

const AGENT_BASE = process.env.NEXT_PUBLIC_MASTRA_BASE_URL || "http://localhost:4111";

function principalHeaders(role: string) {
  if (role === "Agent") {
    return {
      "x-principal-type": "Agent",
      "x-agent-id": "facilitator",
      "x-agent-name": "FacilitatorAgent",
      "x-org-id": "org-1"
    };
  }
  return {
    "x-principal-type": "User",
    "x-user-id": `u-${role.toLowerCase()}`,
    "x-org-id": "org-1",
    "x-roles": role
  };
}

type Trace = {
  ts: number;
  phase: string;
  action: string;
  principal: any;
  resource: any;
  decision?: string;
  reason?: string;
  durationMs?: number;
};

export default function Page() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [k, setK] = useState(50);
  const [asRole, setAsRole] = useState("Student");
  const [log, setLog] = useState<string[]>([]);
  const [showDemo, setShowDemo] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const [fileId, setFileId] = useState<string | null>(null);
  const [classification, setClassification] = useState("internal");

  const [traces, setTraces] = useState<Trace[]>([]);
  const [agentMsgs, setAgentMsgs] = useState<{ roomId: string; text: string; ts: number }[]>([]);

  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [rooms, setRooms] = useState<any[]>([]);

  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [threadChat, setThreadChat] = useState<any[]>([]);
  const [threadInput, setThreadInput] = useState("");
  const [currentSummary, setCurrentSummary] = useState<string>("");
  const [welcomeBrief, setWelcomeBrief] = useState<string>("");

  const [labelsByMessage, setLabelsByMessage] = useState<Record<string, { label:string; classification:string }>>({});
  const [socketConnected, setSocketConnected] = useState(false);
  const [lastRTT, setLastRTT] = useState<number | null>(null);
  const [radialTarget, setRadialTarget] = useState<{ messageId: string; text: string; authorId?: string; authorType?: string } | null>(null);

  // Listen for radial menu events and update target
  useEffect(() => {
    const handleRadialOpen = (e: any) => {
      const detail = e.detail as { x: number; y: number; messageId: string; text: string; authorId?: string; authorType?: string };
      if (detail) {
        setRadialTarget({
          messageId: detail.messageId,
          text: detail.text,
          authorId: detail.authorId,
          authorType: detail.authorType
        });
      }
    };
    
    window.addEventListener("spell:messageRadialOpen", handleRadialOpen);
    return () => window.removeEventListener("spell:messageRadialOpen", handleRadialOpen);
  }, []);

  const socketRef = useRef<Socket | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const sendingRef = useRef(false);

  // socket
  useEffect(() => {
    if (socketRef.current) return;
    const socket = io(AGENT_BASE, { transports: ["websocket"] });
    socketRef.current = socket;

    const addMsg = (m: ChatMsg) => {
      if (seenIdsRef.current.has(m._id || m.id)) return;
      seenIdsRef.current.add(m._id || m.id);
      setChat(prev => [...prev, m]);
    };

    socket.on("chat:message", addMsg);

    socket.on("agent:message", (m: any) => {
      const msg: ChatMsg = {
        id: `a_${m.ts}_${Math.random().toString(36).slice(2)}`,
        roomId: m.roomId,
        authorType: "Agent",
        authorId: "AI Assistant",
        text: m.text,
        ts: m.ts
      };
      addMsg(msg);
    });

    socket.on("agent:message:reset", () => setAgentMsgs([]));
    socket.on("agent:trace", (t: any) => setTraces(prev => [t, ...prev].slice(0, 200)));
    
    // Action result handler for summaries and welcome briefs
    socket.on("action:result", (res: any) => {
      if (res.ok && res.action?.type === "summarizeWindow" && res.data?.summary) {
        setCurrentSummary(res.data.summary);
      }
      if (res.ok && res.action?.type === "welcomeBrief" && res.data?.brief) {
        setWelcomeBrief(res.data.brief);
      }
    });

    // Thread events
    socket.on("thread:created", (t: any) => {
      if (t.roomId === roomId) setThreads(prev => [t, ...prev]);
    });
    socket.on("thread:message", (m: any) => {
      if (activeThread && m.threadId === activeThread.threadId) {
        setThreadChat(prev => [...prev, m]);
      }
    });

    // Socket status tracking
    socket.on("connect", () => setSocketConnected(true));
    socket.on("disconnect", () => setSocketConnected(false));

    // Ping for RTT measurement
    const ping = () => {
      const t0 = performance.now();
      socket.timeout(2500).emit("ping", {}, (err: any) => {
        if (!err) setLastRTT(Math.round(performance.now() - t0));
      });
    };
    const timer = setInterval(ping, 5000);

    return () => { 
      clearInterval(timer);
      socket.disconnect(); 
      socketRef.current = null; 
    };
  }, [roomId, activeThread]);

  // Load rooms on mount
  useEffect(() => {
    fetchRooms().then(setRooms).catch(() => {});
  }, []);

  // Load history when room changes
  useEffect(() => {
    if (roomId) {
      fetchHistory(roomId, 50).then((msgs) => {
        setChat(msgs);
        seenIdsRef.current = new Set(msgs.map((m: any) => m._id || m.id));
      }).catch(() => {});
      
      // Load threads for the room
      listThreads(roomId).then(setThreads).catch(()=>{});
      setActiveThread(null);
      setThreadChat([]);

      // Trigger welcome brief on room open
      const userId = `u-${asRole.toLowerCase()}`; // Use the current role as user ID
      const kMessages = Number(process.env.NEXT_PUBLIC_WELCOME_BRIEF_K ?? 40);
      
      // Try Mastra first, fallback to agentic action
      const triggerWelcomeBrief = async () => {
        try {
          await runMastraAction({ 
            type: "welcomeBrief", 
            roomId, 
            userId, 
            prompt: `Generate a welcome brief for room ${roomId} with the last ${kMessages} messages`,
            kMessages 
          });
        } catch (error) {
          console.log('[Mastra] Welcome brief failed, falling back to agentic action:', error);
          runAgenticAction({ 
            type: "welcomeBrief", 
            roomId, 
            userId, 
            kMessages 
          });
        }
      };
      
      triggerWelcomeBrief();
    }
  }, [roomId, asRole]);

  async function runCreate() {
    try {
      const result = await createThread({ roomId: roomId || "demo", visibility, as: asRole });
      setLog(l => [`ALLOW createThread → ${JSON.stringify(result)}`, ...l]);
    } catch (e: any) {
      setLog(l => [`DENY createThread → ${e.message}`, ...l]);
    }
  }

  async function runSummarize() {
    try {
      const result = await summarizeWindow({ roomId: roomId || "demo", k, as: asRole });
      setLog(l => [`ALLOW summarizeWindow → ${JSON.stringify(result)}`, ...l]);
    } catch (e: any) {
      setLog(l => [`DENY summarizeWindow → ${e.message}`, ...l]);
    }
  }

  async function onUploadChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const id = await uploadFile({ file: f, roomId: roomId || "demo", classification });
      setFileId(id);
      setLog(l => [`UPLOAD ok → fileId=${id}, class=${classification}`, ...l]);
    } catch (e: any) {
      setLog(l => [`UPLOAD fail → ${e.message}`, ...l]);
    }
  }

  async function runAnalyze() {
    if (!fileId) return setLog(l => [`No file uploaded`, ...l]);
    try {
      const result = await analyzeFile({ fileId, roomId: roomId || "demo", as: asRole });
      setLog(l => [`ALLOW analyzeFile → ${JSON.stringify(result)}`, ...l]);
    } catch (e: any) {
      setLog(l => [`DENY analyzeFile → ${e.message}`, ...l]);
    }
  }

  async function runLabelRestricted() {
    try {
      const result = await labelMessage({ messageId: "demo", label: "restricted", classification: "restricted", as: asRole });
      setLog(l => [`ALLOW labelMessage (restricted) → ${JSON.stringify(result)}`, ...l]);
    } catch (e: any) {
      setLog(l => [`DENY labelMessage (restricted) → ${e.message}`, ...l]);
    }
  }

  async function runLabelInternal() {
    try {
      const result = await labelMessage({ messageId: "demo", label: "internal", classification: "internal", as: asRole });
      setLog(l => [`ALLOW labelMessage (internal) → ${JSON.stringify(result)}`, ...l]);
    } catch (e: any) {
      setLog(l => [`DENY labelMessage (internal) → ${e.message}`, ...l]);
    }
  }

  function logLine(s: string) {
    setLog(l => [s, ...l]);
  }

  async function sendWelcomeBrief() {
    try {
      const res = await fetch(`${AGENT_BASE}/events/user-joined`, {
        method: "POST",
        headers: { "content-type": "application/json", ...principalHeaders(asRole) } as any,
        body: JSON.stringify({ roomId })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Denied");
      setLog(l => [`WELCOME ok → posted`, ...l]);
    } catch (e: any) {
      setLog(l => [`WELCOME denied → ${e.message}`, ...l]);
    }
  }

  async function onSend(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || sendingRef.current) return;
    sendingRef.current = true;
    try {
      await sendChatMessage(roomId || "r1", text, asRole);
      setInput("");
    } finally {
      sendingRef.current = false;
    }
  }

  const handleLogin = (loginData: { roomId: string; role: string }) => {
    setRoomId(loginData.roomId);
    setAsRole(loginData.role);
  };

  const handleEnterChat = () => {
    // Show the login form when user clicks "Enter Chat" or "Get Started"
    setShowLogin(true);
  };

  const handleShowLogin = () => {
    setShowLogin(true);
  };

  const handleLogout = () => {
    setRoomId(null);
  };

  // Thread functions
  async function openThread(t: Thread) {
    setActiveThread(t);
    const hist = await fetchThreadHistory(t.threadId, 50);
    setThreadChat(hist);
  }

  async function registerThread(result: {
    threadId: string;
    roomId?: string;
    name?: string;
    visibility?: "public" | "private";
    createdBy?: string;
    originMessageId?: string;
    originAuthorId?: string;
    originAuthorType?: string;
    originSnippet?: string;
  }) {
    const normalized: Thread = {
      threadId: result.threadId,
      roomId: result.roomId ?? roomId!,
      name: result.name || result.threadId,
      visibility: (result.visibility as Thread["visibility"]) || "public",
      createdBy: result.createdBy,
      originMessageId: result.originMessageId,
      originAuthorId: result.originAuthorId,
      originAuthorType: result.originAuthorType,
      originSnippet: result.originSnippet,
    };

    setThreads(prev => {
      const without = prev.filter(t => t.threadId !== normalized.threadId);
      return [normalized, ...without];
    });

    await openThread(normalized);
    return normalized;
  }

  async function createThreadAndOpen(visibility: "public" | "private", metadata: ThreadMetadata = {}) {
    if (!roomId) throw new Error("No active room");
    const created = await createThreadHelper(roomId, visibility, asRole, metadata);
    const thread = await registerThread({
      threadId: created.threadId,
      roomId: created.roomId,
      name: created.name,
      visibility: created.visibility,
      createdBy: created.createdBy,
      originMessageId: created.originMessageId,
      originAuthorId: created.originAuthorId,
      originAuthorType: created.originAuthorType,
      originSnippet: created.originSnippet,
    });
    setLog(l => [`THREAD ${visibility} → ${thread.threadId}`, ...l]);
    return thread;
  }

  async function onCreateThread(visibility: "public"|"private") {
    try {
      await createThreadAndOpen(visibility);
    } catch (error: any) {
      setLog(l => [`Create thread failed → ${error?.message || error}`, ...l]);
    }
  }

  async function sendToThread(e?:React.FormEvent) {
    e?.preventDefault();
    if (!activeThread) return;
    const text = threadInput.trim(); if (!text) return;
    await sendThreadMessage(activeThread.threadId, text, asRole);
    setThreadInput("");
  }

  async function handleForkFromMessage(source: ChatMsg | { messageId: string; text: string; authorId?: string; authorType?: string }) {
    if (!roomId) return;

    try {
      let messageId: string | undefined;
      let fallbackText = "";
      let fallbackAuthorId: string | undefined;
      let fallbackAuthorType: string | undefined;

      if ("messageId" in source) {
        messageId = source.messageId;
        fallbackText = source.text ?? "";
        fallbackAuthorId = source.authorId;
        fallbackAuthorType = source.authorType;
      } else {
        messageId = source._id || source.id;
        fallbackText = source.text ?? "";
        fallbackAuthorId = source.authorId;
        fallbackAuthorType = source.authorType;
      }

      if (!messageId) throw new Error("Unable to determine message id for fork");

      const existing = chat.find(m => (m._id || m.id) === messageId);
      const text = existing?.text ?? fallbackText;
      const authorId = existing?.authorId ?? fallbackAuthorId ?? "Unknown";
      const authorType = existing?.authorType ?? fallbackAuthorType ?? "User";
      const originAuthorType = authorType === "Agent" || authorType === "User" ? authorType : undefined;

      const choice = window.prompt("Fork visibility (public/private)", "public");
      if (choice === null) return; // user cancelled
      const visibility = choice.trim().toLowerCase().startsWith("priv") ? "private" : "public";

      const snippet = text ? text.slice(0, 200) : undefined;
      const metadata: ThreadMetadata = {
        name: `${visibility === "private" ? "Private notes" : "Fork"} • ${authorId}`,
        originMessageId: messageId,
        originAuthorId: authorId,
        originAuthorType,
        originSnippet: snippet,
      };

      const newThread = await createThreadAndOpen(visibility, metadata);

      const shortId = messageId ? messageId.slice(-6) : "";
      const intro = visibility === "private"
        ? `Private fork created from message ${shortId || "(unknown)"} by ${authorId}.`
        : `Forked discussion for message ${shortId || "(unknown)"} by ${authorId}.`;
      const quoted = text
        ? text.split(/\r?\n/).map(line => `> ${line}`).join("\n")
        : "(original message unavailable)";

      await sendThreadMessage(newThread.threadId, `${intro}\n\n${quoted}`, asRole);

      if (visibility === "private") {
        const shouldAsk = window.confirm("Ask the AI for help in this private fork now?");
        if (shouldAsk) {
          await sendThreadMessage(
            newThread.threadId,
            `/ai I need help understanding message ${shortId || messageId}: ${text}`,
            asRole
          );
        }
      }

      setLog(l => [`Forked ${visibility} thread ${newThread.threadId} from ${messageId}`, ...l]);
      setRadialTarget(null);
    } catch (error: any) {
      console.error("Fork failed", error);
      setLog(l => [`Fork failed → ${error?.message || error}`, ...l]);
      setRadialTarget(null);
      window.alert(`Unable to fork message: ${error?.message || error}`);
    }
  }

  // Action handlers
  function handleCopyId(id: string) {
    navigator.clipboard.writeText(id).then(()=>{}).catch(()=>{});
  }

  async function handleLabel(id: string, label: string, classification: "public"|"internal"|"restricted") {
    try {
      await labelMessageAction({ messageId: id, label, classification, as: asRole });
      setLabelsByMessage(prev => ({ ...prev, [id]: { label, classification } }));
      setLog(l => [`ALLOW labelMessage(${classification}) → ${label}`, ...l]);
    } catch (e:any) {
      setLog(l => [`DENY labelMessage(${classification}) → ${e.message}`, ...l]);
    }
  }

  if (roomId) {
    return (
      <>
        <ChatShell 
          roomId={roomId}
          left={
            <ThreadsPanel
              rooms={rooms}
              currentRoomId={roomId}
              onRoomSelect={setRoomId}
              threads={threads}
              activeThread={activeThread}
              onThreadSelect={openThread}
              onCreateThread={onCreateThread}
            />
          }
          center={
            <div className="flex flex-col h-full">
              {/* Chat Messages */}
              <div className="flex-1 overflow-hidden">
                <div className="h-full rounded-3xl border border-border/60 bg-card/60 shadow-soft">
                  <MessageList
                    messages={chat}
                    labelsByMessage={labelsByMessage}
                    onForkFromMessage={handleForkFromMessage}
                    onLabel={handleLabel}
                    onCopyId={handleCopyId}
                  />
                </div>
              </div>
              
              {/* Composer */}
              <div className="mt-4">
                <div className="rounded-3xl border border-border/60 shadow-soft bg-card/70">
                  <Composer
                    value={input}
                    onChange={setInput}
                    onSubmit={onSend}
                    onAttach={onUploadChange}
                    disabled={sendingRef.current}
                  />
                </div>
              </div>
            </div>
          }
          right={
            <RightPanel
              socketConnected={socketConnected}
              lastRTT={lastRTT}
              roomId={roomId}
              asRole={asRole}
              onRoleChange={setAsRole}
              onRoomChange={setRoomId}
              showDemo={showDemo}
              visibility={visibility}
              onVisibilityChange={setVisibility}
              k={k}
              onKChange={setK}
              classification={classification}
              onClassificationChange={setClassification}
              fileId={fileId}
              onUploadChange={onUploadChange}
              onAnalyze={runAnalyze}
              onLabelInternal={runLabelInternal}
              onLabelRestricted={runLabelRestricted}
              onCreateThread={runCreate}
              onSummarize={runSummarize}
              onSendWelcomeBrief={sendWelcomeBrief}
              traces={traces}
              currentSummary={currentSummary}
              welcomeBrief={welcomeBrief}
            />
          }
        />
        
        {/* Cedar Spells Components */}
        <RadialMessageMenu roomId={roomId} target={radialTarget} onFork={handleForkFromMessage} />
        <SpellsMenu roomId={roomId} />
        <SelectionTooltip roomId={roomId} />
        <QuestioningMode />
      </>
    );
  }

  return (
    <div>
      <HomePage onEnterChat={handleEnterChat} onShowLogin={handleShowLogin} />
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <LoginForm onLogin={handleLogin} />
            <button 
              className="absolute top-4 right-4 text-ink-400 hover:text-ink-600"
              onClick={() => setShowLogin(false)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
