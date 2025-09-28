"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { createThread, summarizeWindow, uploadFile, analyzeFile, labelMessage } from "@/agentic/actions";
import { setTeacherPresent, resetTraces, resetMessages, fetchRooms, fetchHistory } from "@/lib/api";
import { sendChatMessage } from "@/lib/chat";
import { listThreads, createThread as createThreadHelper, fetchThreadHistory, sendThreadMessage } from "@/lib/threads";
import LoginForm from "@/components/LoginForm";
import { labelMessage as labelMessageAction } from "@/agentic/actions";
import { createThread as spellCreateThread } from "@/agentic/actions";
import { ChatShell } from "@/layouts/ChatShell";
import { ThreadsPanel, Thread } from "@/components/threads/ThreadsPanel";
import { MessageList, ChatMsg } from "@/components/chat/MessageList";
import { Composer } from "@/components/chat/Composer";
import { RightPanel } from "@/components/right/RightPanel";

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

  const [labelsByMessage, setLabelsByMessage] = useState<Record<string, { label:string; classification:string }>>({});
  const [socketConnected, setSocketConnected] = useState(false);
  const [lastRTT, setLastRTT] = useState<number | null>(null);

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
    }
  }, [roomId]);

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
      const result = await labelMessage({ roomId: roomId || "demo", classification: "restricted", as: asRole });
      setLog(l => [`ALLOW labelMessage (restricted) → ${JSON.stringify(result)}`, ...l]);
    } catch (e: any) {
      setLog(l => [`DENY labelMessage (restricted) → ${e.message}`, ...l]);
    }
  }

  async function runLabelInternal() {
    try {
      const result = await labelMessage({ roomId: roomId || "demo", classification: "internal", as: asRole });
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
        headers: { "content-type": "application/json", ...principalHeaders(asRole) },
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

  const handleLogout = () => {
    setRoomId(null);
  };

  // Thread functions
  async function openThread(t: Thread) {
    setActiveThread(t);
    const hist = await fetchThreadHistory(t.threadId, 50);
    setThreadChat(hist);
  }

  async function onCreateThread(visibility: "public"|"private") {
    const t = await createThreadHelper(roomId!, visibility, asRole);
    // Prefer to open it immediately:
    setThreads(prev => [{ threadId:t.threadId, roomId: roomId!, name:t.name || t.threadId, visibility: visibility }, ...prev]);
    openThread({ threadId:t.threadId, roomId: roomId!, name:t.name || t.threadId, visibility });
  }

  async function sendToThread(e?:React.FormEvent) {
    e?.preventDefault();
    if (!activeThread) return;
    const text = threadInput.trim(); if (!text) return;
    await sendThreadMessage(activeThread.threadId, text, asRole);
    setThreadInput("");
  }

  function forkFromMessage(msgId: string) {
    // simple: create thread and pre-fill with a quoted first message
    onCreateThread("public").then(()=> {
      if (activeThread) sendThreadMessage(activeThread.threadId, `→ forked from message ${msgId}`, asRole);
    });
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

  async function handleForkFromMessage(msgId: string) {
    try {
      const t = await spellCreateThread({ roomId: roomId!, visibility: "public", as: asRole });
      setLog(l => [`Forked thread ${t.threadId} from message ${msgId}`, ...l]);
      // Optionally open the new thread immediately:
      const newT = { threadId: t.threadId, roomId: roomId!, name: t.name || t.threadId, visibility: "public" as const };
      setThreads(prev => [newT, ...prev]);
      openThread(newT);
    } catch (e:any) {
      setLog(l => [`Fork failed → ${e.message}`, ...l]);
    }
  }

  if (roomId) {
    return (
      <ChatShell roomId={roomId}>
        <ThreadsPanel
          rooms={rooms}
          currentRoomId={roomId}
          onRoomSelect={setRoomId}
          threads={threads}
          activeThread={activeThread}
          onThreadSelect={openThread}
          onCreateThread={onCreateThread}
        />
        
        <div className="flex flex-col h-full">
          {/* Chat Messages */}
          <div className="flex-1 overflow-hidden">
            <MessageList
              messages={chat}
              labelsByMessage={labelsByMessage}
              onForkFromMessage={handleForkFromMessage}
              onLabel={handleLabel}
              onCopyId={handleCopyId}
            />
          </div>
          
          {/* Composer */}
          <Composer
            value={input}
            onChange={setInput}
            onSubmit={onSend}
            onAttach={onUploadChange}
            disabled={sendingRef.current}
          />
        </div>
        
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
        />
      </ChatShell>
    );
  }

  return <LoginForm onLogin={handleLogin} />;
}
